// routes/application.routes.js
import express from 'express';
import db from '../database/db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET all applications (with status + program filters)
router.get('/', requireAuth, async (req, res) => {
  const { status, program_id } = req.query;
  let query = `
    SELECT a.*, 
      b.full_name as beneficiary_name, b.beneficiary_code,
      p.name as program_name, p.category as program_category
    FROM applications a
    JOIN beneficiaries b ON a.beneficiary_id = b.id
    JOIN programs p ON a.program_id = p.id
    WHERE 1=1
  `;
  const args = [];

  if (status && status !== 'All') { query += " AND a.status = ?"; args.push(status); }
  if (program_id && program_id !== 'All') { query += " AND a.program_id = ?"; args.push(program_id); }
  query += " ORDER BY a.applied_at DESC";

  try {
    const result = await db.execute({ sql: query, args });
    return res.json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch applications.' });
  }
});

// GET single application by ID
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const result = await db.execute({
      sql: `SELECT a.*, b.full_name as beneficiary_name, p.name as program_name
            FROM applications a
            JOIN beneficiaries b ON a.beneficiary_id = b.id
            JOIN programs p ON a.program_id = p.id
            WHERE a.id = ?`,
      args: [req.params.id]
    });
    if (result.rows.length === 0) return res.status(404).json({ error: 'Application not found.' });
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch application.' });
  }
});

// POST create new application
router.post('/', requireAuth, async (req, res) => {
  const { beneficiary_id, program_id, notes } = req.body;
  if (!beneficiary_id || !program_id) {
    return res.status(400).json({ error: 'Beneficiary and Program are required.' });
  }
  try {
    const countResult = await db.execute("SELECT COUNT(*) as count FROM applications");
    const count = Number(countResult.rows[0].count) + 1;
    const code = `APP-${String(count).padStart(4, '0')}`;
    const now = new Date().toISOString();

    await db.execute({
      sql: `INSERT INTO applications (application_code, beneficiary_id, program_id, status, notes, applied_at) VALUES (?, ?, ?, 'pending', ?, ?)`,
      args: [code, beneficiary_id, program_id, notes || '', now]
    });

    await db.execute({
      sql: `INSERT INTO activity_log (user_id, action, module, description, created_at) VALUES (?, ?, ?, ?, ?)`,
      args: [req.user.id, "CREATE", "applications", `Created application ${code}`, now]
    });

    return res.status(201).json({ message: 'Application submitted.', code });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to submit application.' });
  }
});

// PATCH change application status (approve / reject)
// Admin only for approve/reject
router.patch('/:id/status', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  // Only admin can approve or reject
  if ((status === 'approved' || status === 'rejected') && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admin can approve or reject applications.' });
  }

  try {
    const now = new Date().toISOString();
    let claim_code = null;

    // When approving, generate a unique claim code
    if (status === 'approved') {
      const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
      const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      claim_code = `BA-${datePart}-${randomPart}`;
    }

    await db.execute({
      sql: `UPDATE applications SET status=?, notes=?, claim_code=?, reviewed_at=?, reviewed_by=? WHERE id=?`,
      args: [status, notes || '', claim_code, now, req.user.id, id]
    });

    await db.execute({
      sql: `INSERT INTO activity_log (user_id, action, module, description, created_at) VALUES (?, ?, ?, ?, ?)`,
      args: [req.user.id, status.toUpperCase(), "applications", `Application #${id} status changed to ${status}`, now]
    });

    return res.json({ message: `Application ${status}.`, claim_code });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update status.' });
  }
});

// DELETE application (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    // Delete dependent records first to satisfy foreign key constraints
    await db.execute({ sql: "DELETE FROM distributions WHERE application_id=?", args: [id] });
    await db.execute({ sql: "DELETE FROM applications WHERE id=?", args: [id] });
    return res.json({ message: 'Application and all associated records deleted.' });
  } catch (err) {
    console.error('DELETE /api/applications/:id error:', err);
    return res.status(500).json({ error: `Failed to delete application: ${err.message}` });
  }
});

export default router;
