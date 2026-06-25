// routes/program.routes.js
import express from 'express';
import db from '../database/db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET all programs (with optional status and category filters)
router.get('/', requireAuth, async (req, res) => {
  const { status, category } = req.query;
  let query = `
    SELECT p.*, 
      (SELECT COUNT(*) FROM applications a WHERE a.program_id = p.id AND a.status != 'rejected') as slots_used
    FROM programs p WHERE 1=1
  `;
  const args = [];

  if (status && status !== 'All') { query += " AND p.status = ?"; args.push(status); }
  if (category && category !== 'All') { query += " AND p.category = ?"; args.push(category); }
  query += " ORDER BY p.created_at DESC";

  try {
    const result = await db.execute({ sql: query, args });
    return res.json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch programs.' });
  }
});

// GET single program by ID
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const result = await db.execute({ sql: "SELECT * FROM programs WHERE id = ?", args: [req.params.id] });
    if (result.rows.length === 0) return res.status(404).json({ error: 'Program not found.' });
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch program.' });
  }
});

// POST create new program
router.post('/', requireAuth, async (req, res) => {
  const { name, description, category, budget_slots, start_date, end_date } = req.body;
  if (!name || !category || !budget_slots || !start_date || !end_date) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  try {
    const countResult = await db.execute("SELECT COUNT(*) as count FROM programs");
    const count = Number(countResult.rows[0].count) + 1;
    const code = `PROG-${String(count).padStart(3, '0')}`;
    const now = new Date().toISOString();

    await db.execute({
      sql: `INSERT INTO programs (program_code, name, description, category, budget_slots, start_date, end_date, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [code, name, description || '', category, budget_slots, start_date, end_date, now, req.user.id]
    });

    await db.execute({
      sql: `INSERT INTO activity_log (user_id, action, module, description, created_at) VALUES (?, ?, ?, ?, ?)`,
      args: [req.user.id, "CREATE", "programs", `Created program: ${name} (${code})`, now]
    });

    return res.status(201).json({ message: 'Program created.', code });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to create program.' });
  }
});

// PUT update program
router.put('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { name, description, category, budget_slots, start_date, end_date, status } = req.body;
  try {
    await db.execute({
      sql: `UPDATE programs SET name=?, description=?, category=?, budget_slots=?, start_date=?, end_date=?, status=? WHERE id=?`,
      args: [name, description, category, budget_slots, start_date, end_date, status, id]
    });
    return res.json({ message: 'Program updated.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update program.' });
  }
});

// DELETE program (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    // Delete dependent records first to satisfy foreign key constraints
    await db.execute({ sql: "DELETE FROM distributions WHERE program_id=?", args: [id] });
    await db.execute({ sql: "DELETE FROM applications WHERE program_id=?", args: [id] });
    await db.execute({ sql: "DELETE FROM programs WHERE id=?", args: [id] });
    return res.json({ message: 'Program and all associated records deleted.' });
  } catch (err) {
    console.error('DELETE /api/programs/:id error:', err);
    return res.status(500).json({ error: `Failed to delete program: ${err.message}` });
  }
});

export default router;
