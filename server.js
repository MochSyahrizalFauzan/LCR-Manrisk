import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// Koneksi database
const db = await mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "lcr_database",
});

// ======================= MASTER HQLA =======================
app.get("/hqla_master", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, kode, nama_komponen, level, haircut_rate, row_type 
      FROM hqla_master 
      ORDER BY kode
    `);
    res.json(rows);
  } catch (err) {
    console.error("Error ambil HQLA master:", err);
    res.status(500).json({ error: "Gagal ambil data HQLA master" });
  }
});

// ======================= LIST PERIODE =======================
// Ambil daftar periode unik dalam format YYYY-MM
app.get("/api/lcr/periode", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT DISTINCT DATE_FORMAT(periode, '%Y-%m') AS periode
      FROM lcr_header
      ORDER BY periode DESC
    `);
    res.json(rows.map((r) => r.periode));
  } catch (err) {
    console.error("Error ambil daftar periode:", err);
    res.status(500).json({ error: err.message });
  }
});

// ======================= GET / CREATE HEADER & AMBIL DATA PER PERIODE =======================
app.get('/api/lcr_header/:periode', async (req, res) => {
  try {
    let { periode } = req.params;

    // Validasi format YYYY-MM atau YYYY-MM-DD
    if (!/^\d{4}-\d{2}(-\d{2})?$/.test(periode)) {
      return res.status(400).json({ error: "Format periode tidak valid. Gunakan YYYY-MM atau YYYY-MM-DD" });
    }

    // Ubah YYYY-MM → YYYY-MM-01
    if (/^\d{4}-\d{2}$/.test(periode)) {
      periode = periode + "-01";
    }

    // 1. Cek apakah header sudah ada
    const [headerRows] = await db.query(
      `SELECT * FROM lcr_header WHERE periode = ?`,
      [periode]
    );

    let lcrHeader;
    if (headerRows.length === 0) {
      // Jika belum ada, buat header baru
      const [result] = await db.query(
        `INSERT INTO lcr_header (periode) VALUES (?)`,
        [periode]
      );
      lcrHeader = { id: result.insertId, periode };
    } else {
      lcrHeader = headerRows[0];
    }

    // 2. Ambil data HQLA terkait header ini
    const [hqlaRows] = await db.query(
      `SELECT * FROM hqla_data WHERE lcr_header_id = ?`,
      [lcrHeader.id]
    );

    res.json({
      status: "success",
      header: lcrHeader,
      data: hqlaRows
    });
  } catch (err) {
    console.error("Error ambil/insert header LCR:", err);
    res.status(500).json({ error: err.message });
  }
});



app.post('/api/lcr_header', async (req, res) => {
  try {
    let { periode, nama_bank, dibuat_oleh } = req.body;

    if (!periode) {
      return res.status(400).json({ error: "Periode wajib diisi" });
    }

    if (/^\d{4}-\d{2}$/.test(periode)) {
      periode = periode + "-01";
    }

    const [result] = await db.query(
      `INSERT INTO lcr_header (periode, nama_bank, dibuat_oleh) VALUES (?, ?, ?)`,
      [periode, nama_bank || null, dibuat_oleh || null]
    );

    res.json({ status: "success", id: result.insertId });
  } catch (err) {
    console.error("Error simpan LCR header:", err);
    res.status(500).json({ error: err.message });
  }
});

// ======================= SIMPAN DATA =======================
app.post("/api/hqla_data", async (req, res) => {
  try {
    const { periode, data } = req.body;
    if (!periode) return res.status(400).json({ error: "Periode wajib diisi" });

    const periodeFormatted = /^\d{4}-\d{2}$/.test(periode) ? periode + "-01" : periode;

    // 1. Ambil atau buat header
    let [headerRows] = await db.query(`SELECT id FROM lcr_header WHERE periode = ?`, [periodeFormatted]);
    let lcrHeaderId;
    if (headerRows.length === 0) {
      const [result] = await db.query(`INSERT INTO lcr_header (periode) VALUES (?)`, [periodeFormatted]);
      lcrHeaderId = result.insertId;
    } else {
      lcrHeaderId = headerRows[0].id;
      // hapus data lama
      await db.query(`DELETE FROM hqla_data WHERE lcr_header_id = ?`, [lcrHeaderId]);
    }

    // 2. Insert semua row input user (row_type = item)
    for (const item of data) {
      if (!item.hqla_master_id) continue;
      await db.query(
        `INSERT INTO hqla_data (hqla_master_id, lcr_header_id, nilai_awal, nilai_setelah_haircut)
         VALUES (?, ?, ?, ?)`,
        [item.hqla_master_id, lcrHeaderId, item.nilai_awal || 0, item.nilai_setelah_haircut || 0]
      );
    }

    // 3. Hitung subtotal per level
    const [itemRows] = await db.query(`
      SELECT d.*, m.level
      FROM hqla_data d
      JOIN hqla_master m ON d.hqla_master_id = m.id
      WHERE d.lcr_header_id = ? AND m.row_type='item'
    `, [lcrHeaderId]);

    const subtotalMap = {};
    itemRows.forEach(row => {
      if (!subtotalMap[row.level]) subtotalMap[row.level] = { nilai_awal: 0, nilai_setelah_haircut: 0 };
      subtotalMap[row.level].nilai_awal += parseFloat(row.nilai_awal);
      subtotalMap[row.level].nilai_setelah_haircut += parseFloat(row.nilai_setelah_haircut);
    });

    // 4. Insert row subtotal
    const [subtotalMasters] = await db.query(`SELECT * FROM hqla_master WHERE row_type='subtotal'`);
    for (const row of subtotalMasters) {
      const nilai = subtotalMap[row.level] || { nilai_awal: 0, nilai_setelah_haircut: 0 };
      await db.query(
        `INSERT INTO hqla_data (hqla_master_id, lcr_header_id, nilai_awal, nilai_setelah_haircut)
         VALUES (?, ?, ?, ?)`,
        [row.id, lcrHeaderId, nilai.nilai_awal, nilai.nilai_setelah_haircut]
      );
    }

    // 5. Hitung total (semua level dijumlahkan)
    const t1 = subtotalMap["Level 1"] || { nilai_awal: 0, nilai_setelah_haircut: 0 };
    const t2a = subtotalMap["Level 2A"] || { nilai_awal: 0, nilai_setelah_haircut: 0 };
    const t2b = subtotalMap["Level 2B"] || { nilai_awal: 0, nilai_setelah_haircut: 0 };

    const total = {
      nilai_awal: t1.nilai_awal + t2a.nilai_awal + t2b.nilai_awal,
      nilai_setelah_haircut: t1.nilai_setelah_haircut + t2a.nilai_setelah_haircut + t2b.nilai_setelah_haircut
    };

    const [totalMasters] = await db.query(`SELECT * FROM hqla_master WHERE row_type='total'`);
    for (const row of totalMasters) {
      await db.query(
        `INSERT INTO hqla_data (hqla_master_id, lcr_header_id, nilai_awal, nilai_setelah_haircut)
         VALUES (?, ?, ?, ?)`,
        [row.id, lcrHeaderId, total.nilai_awal, total.nilai_setelah_haircut]
      );
    }

    res.json({ status: "success", lcrHeaderId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ======================= SUMMARY UNTUK DASHBOARD =======================
app.get("/api/lcr/summary/:periode", async (req, res) => {
  try {
    let { periode } = req.params;

    // Format YYYY-MM → YYYY-MM-01
    if (/^\d{4}-\d{2}$/.test(periode)) {
      periode = periode + "-01";
    }

    // Ambil summary
    const [rows] = await db.query(
      `SELECT * FROM lcr_summary s
       JOIN lcr_header h ON s.lcr_header_id = h.id
       WHERE h.periode = ?`,
      [periode]
    );

    if (rows.length === 0) {
      return res.json({
        periode,
        total_level1: 0,
        total_level2a: 0,
        total_level2b: 0,
        lcr_value: 0
      });
    }

    // Ambil detail HQLA untuk breakdown per level
    const [hqla] = await db.query(
      `SELECT m.level, SUM(d.nilai_setelah_haircut) AS total
       FROM hqla_data d
       JOIN hqla_master m ON d.hqla_master_id = m.id
       WHERE d.lcr_header_id = ?
       GROUP BY m.level`,
      [rows[0].lcr_header_id]
    );

    const summary = {
      periode: rows[0].periode,
      jumlah_hqla: rows[0].jumlah_hqla,
      jumlah_net_cash_outflow: rows[0].jumlah_net_cash_outflow,
      lcr_value: rows[0].nilai_lcr,
      breakdown: hqla.reduce((acc, cur) => {
        acc[cur.level] = cur.total;
        return acc;
      }, {})
    };

    res.json(summary);
  } catch (err) {
    console.error("Error ambil summary:", err);
    res.status(500).json({ error: err.message });
  }
});


app.listen(5000, () => console.log("Server running on port 5000"));
