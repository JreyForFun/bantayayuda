// routes/report.routes.js
import express from 'express';
import db from '../database/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/reports/beneficiaries — beneficiary records report
router.get('/beneficiaries', requireAuth, async (req, res) => {
  const { category, status } = req.query;
  let query = "SELECT * FROM beneficiaries WHERE 1=1";
  const args = [];
  if (category && category !== 'All') { query += " AND assistance_category = ?"; args.push(category); }
  if (status && status !== 'All') { query += " AND status = ?"; args.push(status); }
  query += " ORDER BY assistance_category, full_name ASC";
  try {
    const result = await db.execute({ sql: query, args });
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to generate beneficiary report.' });
  }
});

// GET /api/reports/applications — application status summary report
router.get('/applications', requireAuth, async (req, res) => {
  const { program_id, status } = req.query;
  let query = `
    SELECT a.application_code, a.status, a.applied_at, a.reviewed_at, a.claim_code,
      b.full_name as beneficiary_name, b.address, p.name as program_name
    FROM applications a
    JOIN beneficiaries b ON a.beneficiary_id = b.id
    JOIN programs p ON a.program_id = p.id
    WHERE 1=1
  `;
  const args = [];
  if (program_id && program_id !== 'All') { query += " AND a.program_id = ?"; args.push(program_id); }
  if (status && status !== 'All') { query += " AND a.status = ?"; args.push(status); }
  query += " ORDER BY a.applied_at DESC";
  try {
    const result = await db.execute({ sql: query, args });
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to generate application report.' });
  }
});

// GET /api/reports/programs — program utilization summary report
router.get('/programs', requireAuth, async (req, res) => {
  try {
    const result = await db.execute(`
      SELECT p.program_code, p.name, p.category, p.budget_slots, p.status, p.start_date, p.end_date,
        (SELECT COUNT(*) FROM applications a WHERE a.program_id = p.id AND a.status != 'rejected') as total_applications,
        (SELECT COUNT(*) FROM applications a WHERE a.program_id = p.id AND a.status = 'approved') as approved_count,
        (SELECT COUNT(*) FROM applications a WHERE a.program_id = p.id AND a.status = 'released') as released_count
      FROM programs p
      ORDER BY p.created_at DESC
    `);
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to generate program report.' });
  }
});

// GET /api/reports/audit — audit log (admin only)
router.get('/audit', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only.' });
  try {
    const result = await db.execute(`
      SELECT al.*, u.full_name as user_name, u.role as user_role
      FROM activity_log al
      JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC LIMIT 100
    `);
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch audit log.' });
  }
});

export default router;
