// routes/auth.routes.js
// POST /api/auth/login
// POST /api/auth/logout
// GET  /api/auth/me

import express from 'express';
import db from '../database/db.js';
import { sessions, getSession } from '../middleware/auth.js';
const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body

  if(!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }
  try {
    const result = await db.execute({
      sql: "SELECT * FROM users WHERE username = ?",
      args: [username]
     })
     if(result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials.' })
     }
     const user = result.rows[0]

    if(user.password !== password) {
      return res.status(401).json({ error: 'Invalid username or password.'});
    }
     // Generate session token
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    // Save user session in memory
    sessions.set(token, {
      id: user.id,
      username: user.username,
      role: user.role,
      full_name: user.full_name
    });

        // 1. Log the login action to the audit trail database
    await db.execute({
      sql: `INSERT INTO activity_log (user_id, action, module, description, created_at) 
            VALUES (?, ?, ?, ?, ?)`,
      args: [user.id, "LOGIN", "auth", `${user.full_name} logged in.`, new Date().toISOString()]
    });

    // 2. Return the token and user details to the browser
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


} catch(err) {
  console.error(err)
  res.status(500).json({error: 'Internal server error'})
}});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  const token = req.headers['x-session-token'];
  const user = sessions.get(token);

  if (user) {
    // Log the logout action in the audit trail database
    await db.execute({
      sql: `INSERT INTO activity_log (user_id, action, module, description, created_at) 
            VALUES (?, ?, ?, ?, ?)`,
      args: [user.id, "LOGOUT", "auth", `${user.full_name} logged out.`, new Date().toISOString()]
    });
    
    // Remove the session token from our server memory
    sessions.delete(token);
  }

  return res.json({ message: 'Logged out successfully.' });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  const token = req.headers['x-session-token'];
  const user = sessions.get(token);

  if (!user) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }

  // Return the active user profile
  return res.json({ user });
});


export default router;