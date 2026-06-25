// middleware/auth.js — session auth helpers
import db from '../database/db.js';

export async function getSession(req) {
  const token = req.headers['x-session-token'];
  if (!token) return null;
  try {
    const result = await db.execute({
      sql: 'SELECT user_id AS id, username, role, full_name FROM sessions WHERE token = ?',
      args: [token]
    });
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (err) {
    console.error('Session lookup error:', err.message);
    return null;
  }
}

/**
 * Express middleware — requires a valid session.
 */
export async function requireAuth(req, res, next) {
  try {
    const user = await getSession(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized. Please login.' });
    }
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Express middleware — requires admin role.
 */
export async function requireAdmin(req, res, next) {
  try {
    const user = await getSession(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden. Admin access required.' });
    }
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
