// js/auth.js — Login page logic
import { apiFetch, setSession, getSession } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
  // If already logged in, redirect to dashboard
  if (getSession()) {
    window.location.href = '/dashboard.html';
    return;
  }

  const loginForm = document.getElementById('login-form');
  const usernameInput = document.getElementById('login-username');
  const passwordInput = document.getElementById('login-password');
  const errorAlert = document.getElementById('login-error');
  const submitButton = loginForm.querySelector('button[type="submit"]');

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Reset state
    errorAlert.classList.add('d-none');
    errorAlert.textContent = '';
    submitButton.disabled = true;
    submitButton.textContent = 'Authenticating...';

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: { username, password }
      });
      
      // Store session and user data
      setSession(data.token, data.user);
      
      // Redirect to dashboard
      window.location.href = '/dashboard.html';
    } catch (err) {
      errorAlert.textContent = err.message || 'Invalid username or password.';
      errorAlert.classList.remove('d-none');
      submitButton.disabled = false;
      submitButton.textContent = 'Access System';
    }
  });
});
