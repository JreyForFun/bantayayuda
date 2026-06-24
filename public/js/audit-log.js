// js/audit-log.js — Audit log controller
import { apiFetch } from './api.js';

export async function init() {
  const tableBody = document.getElementById('audit-logs-list-body');

  async function fetchAuditLogs() {
    tableBody.innerHTML = `<tr><td colspan="6" class="text-muted text-center" style="padding: 40px 0;">Loading log database...</td></tr>`;
    try {
      const logs = await apiFetch('/reports/audit');
      renderLogsTable(logs);
    } catch (err) {
      tableBody.innerHTML = `<tr><td colspan="6" class="text-muted text-center" style="padding: 40px 0; color: var(--red);">Error loading audit logs: ${err.message}</td></tr>`;
    }
  }

  function renderLogsTable(logs) {
    if (logs.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" class="text-muted text-center" style="padding: 40px 0;">No audit records found.</td></tr>`;
      return;
    }

    tableBody.innerHTML = '';
    logs.forEach(row => {
      const tr = document.createElement('tr');
      const date = new Date(row.created_at).toLocaleString();
      
      // Determine action badge styling
      let actionBadge = 'badge-closed'; // default gray
      if (row.action === 'CREATE') actionBadge = 'badge-active'; // green
      else if (row.action === 'APPROVED') actionBadge = 'badge-approved'; // blue
      else if (row.action === 'RELEASED') actionBadge = 'badge-released'; // dark green
      else if (row.action === 'REJECTED') actionBadge = 'badge-rejected'; // red
      else if (row.action === 'UPDATE') actionBadge = 'badge-pending'; // yellow

      // Determine user role badge styling
      const roleBadge = row.user_role === 'admin' ? 'badge-admin' : 'badge-staff';

      tr.innerHTML = `
        <td><small class="text-muted">${date}</small></td>
        <td><strong>${escapeHtml(row.user_name)}</strong></td>
        <td><span class="badge ${roleBadge}">${escapeHtml(row.user_role)}</span></td>
        <td><span class="badge ${actionBadge}">${escapeHtml(row.action)}</span></td>
        <td><code>${escapeHtml(row.module)}</code></td>
        <td>${escapeHtml(row.description)}</td>
      `;
      tableBody.appendChild(tr);
    });
  }

  // Initial load
  fetchAuditLogs();
}

// Helpers
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
