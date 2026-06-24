// routes/distribution.routes.js
import express from 'express';
import db from '../database/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/distributions/validate/:claimCode — check if claim code is valid
router.get('/validate/:claimCode', requireAuth, async (req, res) => {
  const { claimCode } = req.params;
  try {
    const result = await db.execute({
      sql: `SELECT a.*, b.full_name as beneficiary_name, b.address, p.name as program_name, p.category
            FROM applications a
            JOIN beneficiaries b ON a.beneficiary_id = b.id
            JOIN programs p ON a.program_id = p.id
            WHERE a.claim_code = ?`,
      args: [claimCode]
    });

    if (result.rows.length === 0) {
      return res.status(404).json({ valid: false, error: 'Claim code not found.' });
    }

    const application = result.rows[0];

    if (application.status === 'released') {
      return res.status(400).json({ valid: false, error: 'This claim code has already been used.' });
    }

    if (application.status !== 'approved') {
      return res.status(400).json({ valid: false, error: `Application is ${application.status}, not approved.` });
    }

    return res.json({ valid: true, application });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Validation failed.' });
  }
});

// GET /api/distributions — get recent distribution releases
router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await db.execute({
      sql: `SELECT d.*, b.full_name as beneficiary_name, p.name as program_name, u.full_name as officer_name
            FROM distributions d
            JOIN beneficiaries b ON d.beneficiary_id = b.id
            JOIN programs p ON d.program_id = p.id
            JOIN users u ON d.released_by = u.id
            ORDER BY d.date_released DESC LIMIT 20`,
      args: []
    });
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch distributions.' });
  }
});

// POST /api/distributions — release a claim (confirm distribution)
router.post('/', requireAuth, async (req, res) => {
  const { claim_code, assistance_details } = req.body;
  if (!claim_code) return res.status(400).json({ error: 'Claim code is required.' });

  try {
    // 1. Find the application by claim code
    const appResult = await db.execute({
      sql: `SELECT a.*, p.category FROM applications a JOIN programs p ON a.program_id = p.id WHERE a.claim_code = ?`,
      args: [claim_code]
    });

    if (appResult.rows.length === 0) {
      return res.status(404).json({ error: 'Claim code not found.' });
    }

    const app = appResult.rows[0];

    if (app.status !== 'approved') {
      return res.status(400).json({ error: `Cannot release. Application status is: ${app.status}` });
    }

    const now = new Date().toISOString();

    // 2. Insert distribution record
    await db.execute({
      sql: `INSERT INTO distributions (application_id, beneficiary_id, program_id, assistance_type, assistance_details, date_released, released_by, claim_code_used) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [app.id, app.beneficiary_id, app.program_id, app.category, assistance_details || 'As per program', now, req.user.id, claim_code]
    });

    // 3. Update application status to released
    await db.execute({
      sql: "UPDATE applications SET status='released' WHERE id=?",
      args: [app.id]
    });

    // 4. Audit log
    await db.execute({
      sql: `INSERT INTO activity_log (user_id, action, module, description, created_at) VALUES (?, ?, ?, ?, ?)`,
      args: [req.user.id, "RELEASED", "distributions", `Released claim ${claim_code} by ${req.user.full_name}`, now]
    });

    return res.json({ message: 'Assistance released successfully.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to process release.' });
  }
});

export default router;
