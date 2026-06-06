const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", async (req, res) => {
  try {
    const { search, department_id } = req.query;
    let query = `
      SELECT e.*, d.name AS department_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (search && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      query += `
        AND (
          e.first_name LIKE ?
          OR e.last_name LIKE ?
          OR e.email LIKE ?
          OR CONCAT(e.first_name, ' ', e.last_name) LIKE ?
          OR CONCAT(e.last_name, ' ', e.first_name) LIKE ?
        )
      `;
      params.push(term, term, term, term, term);
    }

    if (department_id) {
      query += ` AND e.department_id = ?`;
      params.push(department_id);
    }

    query += ` ORDER BY e.id ASC`;
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Error in GET /api/employees:', err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

router.get("/hiring-trend", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        DATE_FORMAT(created_at, '%b')  AS month,
        MONTH(created_at)              AS month_num,
        YEAR(created_at)               AS year,
        COUNT(*)                       AS hires
      FROM employees
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY year, month_num, month
      ORDER BY year ASC, month_num ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error('Error in GET /api/employees/hiring-trend:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT e.*, d.name AS department_name
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.id
       WHERE e.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Employee not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error('Error in GET /api/employees/:id:', err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

router.post("/", async (req, res) => {
  try {
    const { first_name, last_name, email, contact_number, salary, address, dob, age, image_url, department_id } = req.body;

    const deptId = department_id && department_id !== 'null' && department_id !== ''
      ? parseInt(department_id)
      : null;

    const [result] = await db.query(
      `INSERT INTO employees
        (first_name, last_name, email, contact_number, salary, address, dob, age, image_url, department_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [first_name, last_name, email, contact_number, salary, address, dob, age, image_url || 'default.png', deptId]
    );
    res.status(201).json({ message: "Employee created", id: result.insertId });
  } catch (err) {
    console.error('Error in POST /api/employees:', err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { first_name, last_name, email, contact_number, salary, address, dob, age, image_url, department_id } = req.body;

    const deptId = department_id && department_id !== 'null' && department_id !== ''
      ? parseInt(department_id)
      : null;

    await db.query(
      `UPDATE employees SET
        first_name=?, last_name=?, email=?, contact_number=?, salary=?,
        address=?, dob=?, age=?, image_url=?, department_id=?
       WHERE id=?`,
      [
        first_name, last_name, email, contact_number, salary,
        address, dob, age,
        image_url || 'default.png',
        deptId,
        req.params.id
      ]
    );
    res.json({ message: "Employee updated" });
  } catch (err) {
    console.error('Error in PUT /api/employees/:id:', err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM employees WHERE id = ?", [req.params.id]);
    res.json({ message: "Employee deleted" });
  } catch (err) {
    console.error('Error in DELETE /api/employees/:id:', err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

module.exports = router;
