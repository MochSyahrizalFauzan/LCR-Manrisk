import React from "react";
import { Accordion, Table, Form } from "react-bootstrap";

export default function CardSection({ eventKey, title, rows, onChangeValue }) {
  return (
    <Accordion.Item eventKey={eventKey} className="mb-3 shadow-sm">
      <Accordion.Header>{title}</Accordion.Header>
      <Accordion.Body>
        <Table bordered hover responsive>
          <thead className="table-header-red">
            <tr>
              <th style={{ width: "50px" }}>No</th>
              <th>Komponen</th>
              <th style={{ width: "150px" }}>Hair Cut / Run Off Rate</th>
              <th style={{ width: "150px" }}>Nilai (Rp.)</th>
              <th style={{ width: "180px" }}>Nilai Setelah Haircut</th>
              <th>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx}>
                <td>{idx + 1}</td>
                <td>{row.nama}</td>
                <td>{row.haircut}%</td>
                <td>
                  <Form.Control
                    type="text"
                    value={row.value}
                    onChange={(e) => onChangeValue(idx, e.target.value)}
                    placeholder="Input"
                  />
                </td>
                <td>{row.afterValue.toLocaleString("id-ID")}</td>
                <td>{row.keterangan || ""}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Accordion.Body>
    </Accordion.Item>
  );
}
