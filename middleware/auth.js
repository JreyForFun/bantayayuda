// middleware/auth.js

// 1. In-memory session store (Key: token string, Value: user info)
export const sessions = new Map();

// 2. Helper to get the logged-in user from the custom header
export function getSession(req) {
  const token = req.headers['x-session-token'];
  return sessions.get(token);
}

// 3. Middleware to check if a user is logged in
export function requireAuth(req, res, next) {
  const user = getSession(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized. Please login.' });
  }
  req.user = user; // Attach user to the request object
  next();
}

// 4. Middleware to check if the user is an Admin
export function requireAdmin(req, res, next) {
  const user = getSession(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden. Admin access required.' });
  }
  req.user = user;
  next();
}
