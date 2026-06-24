// js/api.js — Centralized fetch() wrapper

export const API_BASE = '/api';


export async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  // Setup headers
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  
  // Attach x-session-token if present in localStorage
  const token = localStorage.getItem('session_token');
  if (token) {
    headers['x-session-token'] = token;
  }
  
  const fetchOptions = {
    ...options,
    headers
  };
  
  // Handle JSON body
  if (fetchOptions.body && typeof fetchOptions.body === 'object') {
    fetchOptions.body = JSON.stringify(fetchOptions.body);
  }
  
  try {
    const res = await fetch(url, fetchOptions);
    
    // Check if unauthorized and not on login page
    if (res.status === 401 && !endpoint.includes('/auth/login')) {
      clearSession();
      // Redirect to login if not already there
      if (!window.location.pathname.endsWith('/index.html') && window.location.pathname !== '/') {
        window.location.href = '/index.html';
      }
      throw new Error('Session expired. Please log in again.');
    }
    
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'API Request failed');
    }
    return data;
  } catch (err) {
    console.error(`API Error on ${url}:`, err.message);
    throw err;
  }
}

/**
 * Save user session data
 * @param {string} token 
 * @param {object} user 
 */
export function setSession(token, user) {
  localStorage.setItem('session_token', token);
  localStorage.setItem('current_user', JSON.stringify(user));
}

/**
 * Get active user session info
 * @returns {object|null}
 */
export function getSession() {
  const token = localStorage.getItem('session_token');
  const userStr = localStorage.getItem('current_user');
  if (!token || !userStr) return null;
  try {
    return { token, user: JSON.parse(userStr) };
  } catch (e) {
    return null;
  }
}

/**
 * Clear local session storage
 */
export function clearSession() {
  localStorage.removeItem('session_token');
  localStorage.removeItem('current_user');
}

/**
 * Log out user from backend and redirect
 */
export async function logout() {
  try {
    await apiFetch('/auth/logout', { method: 'POST' });
  } catch (err) {
    console.warn('Logout API failed:', err.message);
  } finally {
    clearSession();
    window.location.href = '/index.html';
  }
}
