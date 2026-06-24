// routes/dashboard.routes.js
import express from 'express';
import db from '../database/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/dashboard/stats — all dashboard numbers in one request
router.get('/stats', requireAuth, async (req, res) => {
  try {
    // Run all COUNT queries in parallel for speed
    const [beneficiaries, programs, applications, approved, released, recentActivity, programUtilization] = await Promise.all([
      db.execute("SELECT COUNT(*) as count FROM beneficiaries"),
      db.execute("SELECT COUNT(*) as count FROM programs WHERE status = 'active'"),
      db.execute("SELECT COUNT(*) as count FROM applications"),
      db.execute("SELECT COUNT(*) as count FROM applications WHERE status = 'approved'"),
      db.execute("SELECT COUNT(*) as count FROM applications WHERE status = 'released'"),
      db.execute(`
        SELECT al.description, al.created_at, u.full_name as user_name, al.action
        FROM activity_log al 
        JOIN users u ON al.user_id = u.id
        ORDER BY al.created_at DESC LIMIT 5
      `),
      db.execute(`
        SELECT p.name, p.budget_slots, p.category,
          (SELECT COUNT(*) FROM applications a WHERE a.program_id = p.id AND a.status != 'rejected') as slots_used
        FROM programs p WHERE p.status = 'active' ORDER BY slots_used DESC LIMIT 3
      `)
    ]);

    return res.json({
      total_beneficiaries: beneficiaries.rows[0].count,
      total_programs: programs.rows[0].count,
      total_applications: applications.rows[0].count,
      approved_applications: approved.rows[0].count,
      released_distributions: released.rows[0].count,
      recent_activity: recentActivity.rows,
      program_utilization: programUtilization.rows
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load dashboard stats.' });
  }
});

export default router;
