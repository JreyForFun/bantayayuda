// js/app.js — Main router: sidebar nav, load page sections, session check
import { getSession, logout } from './api.js';

// Page configuration mapping
const pages = {
  'nav-dashboard': {
    title: 'Dashboard',
    html: 'pages/dashboard.html',
    js: './dashboard.js'
  },
  'nav-beneficiaries': {
    title: 'Beneficiaries',
    html: 'pages/beneficiaries.html',
    js: './beneficiary.js'
  },
  'nav-programs': {
    title: 'Programs',
    html: 'pages/programs.html',
    js: './program.js'
  },
  'nav-applications': {
    title: 'Applications',
    html: 'pages/applications.html',
    js: './application.js'
  },
  'nav-distribution': {
    title: 'Distribution Terminal',
    html: 'pages/distribution.html',
    js: './distribution.js'
  },
  'nav-reports': {
    title: 'Reports & Analytics',
    html: 'pages/reports.html',
    js: './report.js'
  },
  'nav-audit-log': {
    title: 'System Audit Logs',
    html: 'pages/audit-log.html',
    js: './audit-log.js',
    adminOnly: true
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  const session = getSession();
  
  // 1. Session and Role Verification
  if (!session) {
    window.location.href = '/index.html';
    return;
  }
  
  const { user } = session;
  
  // Set User Profile Display
  const displayName = user.full_name || user.username;
  document.getElementById('user-display-name').textContent = `Welcome, ${displayName}`;
  document.getElementById('user-name').textContent = displayName;
  document.getElementById('user-role').textContent = user.role;
  
  // Initials for avatar
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
  document.getElementById('user-avatar').textContent = initials;
  
  // Role-based visibility
  if (user.role === 'admin') {
    document.querySelectorAll('.admin-nav').forEach(el => {
      el.style.display = 'flex';
    });
  }
  
  // 2. View Routing Logic
  const viewport = document.getElementById('viewport');
  const pageTitleEl = document.getElementById('current-page-title');
  const navLinks = document.querySelectorAll('.nav-link');
  
  async function loadView(pageId) {
    const pageConfig = pages[pageId];
    if (!pageConfig) return;
    
    // Authorization check
    if (pageConfig.adminOnly && user.role !== 'admin') {
      alert('Access Denied: Administrator role required.');
      return;
    }
    
    // Update active class on nav links
    navLinks.forEach(link => {
      if (link.id === pageId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
    
    // Update Header Page Title
    pageTitleEl.textContent = pageConfig.title;
    
    try {
      // Fetch and inject HTML
      const response = await fetch(pageConfig.html);
      if (!response.ok) throw new Error(`Failed to load template ${pageConfig.html}`);
      const htmlContent = await response.text();
      viewport.innerHTML = htmlContent;
      
      if (window.lucide) {
        window.lucide.createIcons();
      }
      
      // Dynamically import and initialize JS module
      // Cache-busting using timestamp avoids stale code during live updates
      const modulePath = `${pageConfig.js}?t=${Date.now()}`;
      const controller = await import(modulePath);
      
      if (controller.init && typeof controller.init === 'function') {
        controller.init();
      }
    } catch (err) {
      console.error(`Error loading view: ${pageId}`, err);
      viewport.innerHTML = `
        <div class="alert alert-error">
          <h3>Error Loading Content</h3>
          <p>${err.message}</p>
        </div>
      `;
    }
  }
  
  // Add Nav Menu Click Handlers
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      loadView(link.id);
    });
  });
  
  // Add Logout Click Handler
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      if (confirm('Are you sure you want to log out?')) {
        await logout();
      }
    });
  }
  
  // Load Default Page (Dashboard)
  await loadView('nav-dashboard');
});

// Global SMS simulator helper
let smsTimer = null;
window.triggerSmsSimulator = function(message) {
  const phone = document.getElementById('sms-simulator-phone');
  const text = document.getElementById('sms-simulator-text');
  if (!phone || !text) return;
  
  clearTimeout(smsTimer);
  text.innerHTML = message;
  phone.classList.add('show');
  
  smsTimer = setTimeout(() => {
    phone.classList.remove('show');
  }, 7000);
};

