// routes/beneficiary.routes.js
// GET    /api/beneficiaries         — list all (with search + filter)
// GET    /api/beneficiaries/:id     — get one
// POST   /api/beneficiaries         — create
// PUT    /api/beneficiaries/:id     — update
// DELETE /api/beneficiaries/:id     — delete (admin only)
// GET    /api/beneficiaries/check-duplicate — duplicate check

import express from 'express';
import db from '../database/db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const { search, category } = req.query;

  let query = "SELECT * FROM beneficiaries WHERE 1=1";
  const args = [];

  if (category && category !== 'All') {
    query += " AND assistance_category = ?";
    args.push(category);
  }
  if (search) {
    query += " AND (full_name LIKE ? OR address LIKE ? OR beneficiary_code LIKE ?)";
    const w = `%${search}%`;
    args.push(w, w, w);
  }

  query += " ORDER BY full_name ASC";

  try {
    const result = await db.execute({ sql: query, args });
    return res.json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch beneficiaries.' });
  }
});

router.get('/check-duplicate', requireAuth, async (req, res) => {
  const { name } = req.query;
  if (!name || name.trim().length < 3) return res.json({ duplicate: false });

  try {
    const result = await db.execute({
      sql: "SELECT id, full_name, address FROM beneficiaries WHERE full_name LIKE ?",
      args: [`%${name.trim()}%`]
    });
    if (result.rows.length > 0) {
      return res.json({ duplicate: true, matches: result.rows });
    }
    return res.json({ duplicate: false });
  } catch (err) {
    return res.status(500).json({ error: 'Duplicate check failed.' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  const { name, address, contact, birthdate, category } = req.body;
  if (!name || !address || !contact || !birthdate || !category) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  try {
    const countResult = await db.execute("SELECT COUNT(*) as count FROM beneficiaries");
    const count = Number(countResult.rows[0].count) + 1;
    const code = `BEN-${String(count).padStart(4, '0')}`;
    const now = new Date().toISOString();

    await db.execute({
      sql: `INSERT INTO beneficiaries (beneficiary_code, full_name, address, contact_number, birthdate, assistance_category, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [code, name, address, contact, birthdate, category, now, req.user.id]
    });

    await db.execute({
      sql: `INSERT INTO activity_log (user_id, action, module, description, created_at) VALUES (?, ?, ?, ?, ?)`,
      args: [req.user.id, "CREATE", "beneficiaries", `Registered beneficiary ${name} (${code})`, now]
    });

    return res.status(201).json({ message: 'Beneficiary registered.', code });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to register beneficiary.' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { name, address, contact, birthdate, category, status } = req.body;
  try {
    await db.execute({
      sql: `UPDATE beneficiaries SET full_name=?, address=?, contact_number=?, birthdate=?, assistance_category=?, status=? WHERE id=?`,
      args: [name, address, contact, birthdate, category, status, id]
    });
    return res.json({ message: 'Beneficiary updated.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update beneficiary.' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute({ sql: "DELETE FROM beneficiaries WHERE id=?", args: [id] });
    return res.json({ message: 'Beneficiary deleted.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete beneficiary.' });
  }
});

export default router;
