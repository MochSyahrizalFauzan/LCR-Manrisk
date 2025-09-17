  // server.js
  import express from "express";
  import mysql from "mysql2/promise";
  import cors from "cors";

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));


  const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "",
    database: process.env.DB_NAME || "lcr_database",
  });

  // ---------- MASTER ----------
  app.get("/hqla_master", async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM hqla_master ORDER BY kode");
    res.json(rows);
  });

  app.get("/cashflow_master", async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM cashflow_master ORDER BY id ASC");
    res.json(rows);
  });

// ---------- CREATE / UPDATE LCR HEADER ----------
app.post("/api/lcr_header", async (req, res) => {
  const { periode, nama_bank, dibuat_oleh } = req.body;
  if (!periode || !nama_bank || !dibuat_oleh) {
    return res.status(400).json({ ok: false, error: "periode, nama_bank, dibuat_oleh wajib diisi" });
  }

  try {
    // Upsert header: jika sudah ada periode, update; jika belum, insert
    const [result] = await pool.query(
      `INSERT INTO lcr_header(periode, nama_bank, dibuat_oleh)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE nama_bank=VALUES(nama_bank), dibuat_oleh=VALUES(dibuat_oleh)`,
      [periode, nama_bank, dibuat_oleh]
    );

    // Ambil header terbaru
    const [[hdr]] = await pool.query("SELECT * FROM lcr_header WHERE periode=?", [periode]);
    res.json({ ok: true, data: hdr });
  } catch (err) {
    console.error("Error upsert header:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ---------- GET HQLA DATA PER PERIODE ----------
app.get("/api/hqla_data/:periode", async (req, res) => {
  const periode = req.params.periode;
  try {
    // Ambil id header dulu
    const [[hdr]] = await pool.query(
      "SELECT id FROM lcr_header WHERE periode=?", [periode]);
    if (!hdr) 
      return res.status(404).json({ ok: false, error: "Header tidak ditemukan" });

    // Ambil data HQLA
    const [rows] = await pool.query(
      `SELECT h.*, hm.kode, hm.nama_komponen, hm.haircut_rate
       FROM hqla_data h
       JOIN hqla_master hm ON hm.id=h.hqla_master_id
       WHERE h.lcr_header_id=?`,
      [hdr.id]
    );

    res.json({ ok: true, data: rows || [] });
  } catch (err) {
    console.error("Error GET HQLA data:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ---------- HQLA DATA ----------
app.post("/api/hqla_data", async (req, res) => {
  const { periode, lcr_header_id, data, user } = req.body;

  if (!lcr_header_id) {
    return res.status(400).json({ ok: false, error: "lcr_header_id wajib ada" });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 🔹 Ambil user pembuat dari lcr_header
    const [headerUser] = await conn.query(
      "SELECT dibuat_oleh FROM lcr_header WHERE id = ?",
      [lcr_header_id]
    );
      console.log("DEBUG HEADER:", headerUser);

    const dibuatOleh = headerUser[0]?.dibuat_oleh || user || "system";

      console.log("DEBUG DILAKUKAN_OLEH:", dibuatOleh);

    for (const item of data) {
      // Ambil haircut rate default kalau tidak dikirim
      const [m] = await conn.query(
        "SELECT haircut_rate FROM hqla_master WHERE id=?",
        [item.hqla_master_id]
      );
      const rate = item.used_haircut_rate ?? m[0]?.haircut_rate ?? 0;

      // Insert/update ke hqla_data
      const [result] = await conn.query(
        `INSERT INTO hqla_data(hqla_master_id,lcr_header_id,nilai_awal,nilai_setelah_haircut)
         VALUES (?,?,?,?)
         ON DUPLICATE KEY UPDATE 
           nilai_awal=VALUES(nilai_awal),
           nilai_setelah_haircut=VALUES(nilai_setelah_haircut)`,
        [item.hqla_master_id, lcr_header_id, item.nilai_awal, item.nilai_setelah_haircut]
      );

      // Tentukan aksi: INSERT atau UPDATE
      const aksi = result.affectedRows === 1 ? "INSERT" : "UPDATE";

      // Audit log
      await conn.query(
        `INSERT INTO lcr_audit_log (tabel, record_id, aksi, deskripsi, dilakukan_oleh)
         VALUES (?, ?, ?, ?, ?)`,
        [
          'hqla_data',
          item.hqla_master_id,
          aksi,
          JSON.stringify(item),
          dibuatOleh, 
        ]
      );
    }


    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    console.error("Error saving HQLA data:", e);
    await conn.rollback();
    res.status(500).json({ ok: false, error: e.message });
  } finally {
    conn.release();
  }
});


// ---------- CASHFLOW DATA ----------
app.post("/api/cashflow_data", async (req, res) => {
  const { lcr_header_id, data, user } = req.body;

  // cukup cek lcr_header_id saja
  if (!lcr_header_id) {
    return res.status(400).json({ ok: false, error: "lcr_header_id wajib ada" });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    for (const item of data) {
      const [result] = await conn.query(
        `INSERT INTO cashflow_data(cashflow_master_id,lcr_header_id,nilai_awal,nilai_terhitung)
         VALUES (?,?,?,?)
         ON DUPLICATE KEY UPDATE nilai_awal=VALUES(nilai_awal), nilai_terhitung=VALUES(nilai_terhitung)`,
        [item.cashflow_master_id, lcr_header_id, item.nilai_awal, item.nilai_terhitung]
      );

    const aksi = result.insertId > 0 ? "INSERT" : "UPDATE";

      // Audit log fix
      await conn.query(
        `INSERT INTO lcr_audit_log (tabel, record_id, aksi, deskripsi, dilakukan_oleh)
         VALUES (?, ?, ?, ?, ?)`,
        [
          'cashflow_data',
          item.cashflow_master_id,
          aksi,
          JSON.stringify(item),
          user || "system"
        ]
      );
    }
    


    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    console.error("Error saving Cashflow data:", e);
    await conn.rollback();
    res.status(500).json({ ok: false, error: e.message });
  } finally {
    conn.release();
  }
});

app.get("/api/cashflow_data/:periode", async (req, res) => {
  const periode = req.params.periode;

  try {
    const [[hdr]] = await pool.query(
      "SELECT id FROM lcr_header WHERE periode=?",
      [periode]
    );
    if (!hdr) return res.status(404).json({ ok: false, error: "Header tidak ditemukan" });

    const [rows] = await pool.query(
      `SELECT d.*, m.kode, m.nama_komponen, m.kategori
       FROM cashflow_data d
       JOIN cashflow_master m ON m.id=d.cashflow_master_id
       WHERE d.lcr_header_id=?`,
      [hdr.id]
    );

    res.json({ ok: true, data: rows || [] });
  } catch (err) {
    console.error("Error GET Cashflow data:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});


  // ---------- SUMMARY & LCR ----------
  async function recalcAndUpsertSummary(conn, lcr_header_id) {
    const [[{ total_hqla = 0 }]] = await conn.query(
      "SELECT COALESCE(SUM(nilai_setelah_haircut),0) AS total_hqla FROM hqla_data WHERE lcr_header_id=?",
      [lcr_header_id]
    );

    const [[{ total_out = 0 }]] = await conn.query(
      `SELECT COALESCE(SUM(d.nilai_terhitung),0) AS total_out
      FROM cashflow_data d 
      JOIN cashflow_master m ON m.id=d.cashflow_master_id
      WHERE d.lcr_header_id=? AND m.kategori='Outflow'`,
      [lcr_header_id]
    );

    const [[{ total_in = 0 }]] = await conn.query(
      `SELECT COALESCE(SUM(d.nilai_terhitung),0) AS total_in
      FROM cashflow_data d 
      JOIN cashflow_master m ON m.id=d.cashflow_master_id
      WHERE d.lcr_header_id=? AND m.kategori='Inflow'`,
      [lcr_header_id]
    );

    const inflowUsed = Math.min(total_in, 0.75 * total_out);
    const ncof = total_out - inflowUsed;

    // 👇 hitung LCR
    const nilai_lcr = ncof > 0 ? (total_hqla / ncof) * 100 : null;

    // upsert summary
  await conn.query(
    `INSERT INTO lcr_summary(lcr_header_id, jumlah_hqla, jumlah_net_cash_outflow)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        jumlah_hqla=VALUES(jumlah_hqla),
        jumlah_net_cash_outflow=VALUES(jumlah_net_cash_outflow)`,
    [lcr_header_id, total_hqla, ncof]
  );
    return { total_hqla, total_out, total_in, inflow_used: inflowUsed, ncof, nilai_lcr };
  }

  app.post("/api/lcr/recalc", async (req, res) => {
    const { periode } = req.body;
    const p = req.params.periode || periode;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Ambil header ID
      const [[hdr]] = await conn.query(
        "SELECT id, dibuat_oleh FROM lcr_header WHERE periode=?",
        [p]
      );
      if (!hdr) throw new Error("Header tidak ditemukan");

      // // Recalculate dan update summary
      const result = await recalcAndUpsertSummary(conn, hdr.id);
      await conn.commit();

      // Ambil summary terbaru setelah commit
      const [[summary]] = await pool.query(
        `SELECT jumlah_hqla, jumlah_net_cash_outflow, nilai_lcr
         FROM lcr_summary
         WHERE lcr_header_id=?
         ORDER BY id DESC
         LIMIT 1`,
        [hdr.id]
      );

      // Response lengkap
      res.json({
        ok: true,
        header_id: hdr.id,
        dibuat_oleh: hdr.dibuat_oleh,
        summary: summary || null,
        detail: result,
      });
    } catch (e) {
      await conn.rollback();
      res.status(500).json({ ok: false, error: e.message });
    } finally {
      conn.release();
    }
  });


  app.get("/api/lcr_summary/:periode", async (req, res) => {
    const p = req.params.periode || req.body.periode;

    const [[hdr]] = await pool.query(
      "SELECT id FROM lcr_header WHERE periode=?",
      [p]
    );
    if (!hdr) return res.json({ ok: true, data: null });

    const [[row]] = await pool.query(
      `SELECT jumlah_hqla, jumlah_net_cash_outflow, nilai_lcr 
       FROM lcr_summary 
       WHERE lcr_header_id=?
       ORDER BY id DESC
       LIMIT 1`,
      [hdr.id]
    );

    res.json({ ok: true, data: row || null });
  });


  // ---------- DASHBOARD ----------
// 1. Daftar periode (dropdown)
app.get("/api/periodes", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT DISTINCT periode FROM lcr_header ORDER BY periode DESC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Ringkasan per periode
app.get("/api/lcr_summary/:periode", async (req, res) => {
  const { periode } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT s.*, h.periode 
       FROM lcr_summary s
       JOIN lcr_header h ON s.lcr_header_id = h.id
       WHERE h.periode = ?`,
      [periode]
    );
    res.json(rows[0] || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Trend summary (semua periode, buat chart)
app.get("/api/lcr_trend", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT h.periode, s.jumlah_hqla, s.jumlah_net_cash_outflow, s.nilai_lcr
       FROM lcr_summary s
       JOIN lcr_header h ON s.lcr_header_id = h.id
       ORDER BY h.periode ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


  app.listen(5000, () => console.log("API running on http://localhost:5000"));
