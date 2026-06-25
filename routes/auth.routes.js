// routes/auth.routes.js — authentication endpoints

import express from 'express';
import db from '../database/db.js';
const router = express.Router();

// Ensure sessions table exists
await db.execute(`
  CREATE TABLE IF NOT EXISTS sessions (
    token     TEXT PRIMARY KEY,
    user_id   INTEGER NOT NULL,
    username  TEXT NOT NULL,
    role      TEXT NOT NULL,
    full_name TEXT NOT NULL,
    created_at TEXT NOT NULL
  )
`);

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const result = await db.execute({
      sql: 'SELECT * FROM users WHERE username = ?',
      args: [username]
    });

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const user = result.rows[0];

    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);

    
    await db.execute({
      sql: `INSERT INTO sessions (token, user_id, username, role, full_name, created_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [token, user.id, user.username, user.role, user.full_name, new Date().toISOString()]
    });
    await db.execute({
      sql: `INSERT INTO activity_log (user_id, action, module, description, created_at)
            VALUES (?, ?, ?, ?, ?)`,
      args: [user.id, 'LOGIN', 'auth', `${user.full_name} logged in.`, new Date().toISOString()]
    });

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        full_name: user.full_name
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/logout', async (req, res) => {
  const token = req.headers['x-session-token'];

  if (token) {
    try {
      const result = await db.execute({
        sql: 'SELECT user_id, full_name FROM sessions WHERE token = ?',
        args: [token]
      });

      if (result.rows.length > 0) {
        const { user_id, full_name } = result.rows[0];
        await db.execute({
          sql: `INSERT INTO activity_log (user_id, action, module, description, created_at)
                VALUES (?, ?, ?, ?, ?)`,
          args: [user_id, 'LOGOUT', 'auth', `${full_name} logged out.`, new Date().toISOString()]
        });
      }
      await db.execute({ sql: 'DELETE FROM sessions WHERE token = ?', args: [token] });
    } catch (err) {
      console.error('Logout error:', err.message);
    }
  }

  return res.json({ message: 'Logged out successfully.' });
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  const token = req.headers['x-session-token'];
  if (!token) return res.status(401).json({ error: 'Not authenticated.' });

  try {
    const result = await db.execute({
      sql: 'SELECT user_id AS id, username, role, full_name FROM sessions WHERE token = ?',
      args: [token]
    });

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }

    return res.json({ user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;