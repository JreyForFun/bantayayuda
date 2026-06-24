// js/dashboard.js — Dashboard controller
import { apiFetch } from './api.js';

export async function init() {
  const statBeneficiaries = document.getElementById('stat-total-beneficiaries');
  const statPrograms = document.getElementById('stat-total-programs');
  const statApplications = document.getElementById('stat-total-applications');
  const statApproved = document.getElementById('stat-approved-applications');
  const statReleased = document.getElementById('stat-released-distributions');
  const programList = document.getElementById('dashboard-programs-utilization');
  const activityFeed = document.getElementById('dashboard-recent-activities');

  try {
    const data = await apiFetch('/dashboard/stats');
    
    // 1. Populate stats cards
    statBeneficiaries.textContent = data.total_beneficiaries;
    statPrograms.textContent = data.total_programs;
    statApplications.textContent = data.total_applications;
    statApproved.textContent = data.approved_applications;
    statReleased.textContent = data.released_distributions;
    
    // 2. Render program utilization
    if (data.program_utilization && data.program_utilization.length > 0) {
      programList.innerHTML = '';
      data.program_utilization.forEach(prog => {
        const slotsUsed = Number(prog.slots_used || 0);
        const budgetSlots = Number(prog.budget_slots || 0);
        const percent = budgetSlots > 0 ? Math.round((slotsUsed / budgetSlots) * 100) : 0;
        
        // Determine fill color class
        let fillClass = 'green';
        if (percent > 85) {
          fillClass = 'red';
        } else if (percent > 60) {
          fillClass = 'yellow';
        }
        
        const item = document.createElement('div');
        item.className = 'program-util-item';
        item.style.marginBottom = '14px';
        item.innerHTML = `
          <div class="util-header" style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px;">
            <span class="program-name" style="font-weight: 500; color: var(--text);">${escapeHtml(prog.name)}</span>
            <span class="util-percent" style="font-weight: 600; color: var(--text-muted);">${percent}%</span>
          </div>
          <div class="progress-bar-bg" style="margin-bottom: 4px;">
            <div class="progress-bar-fill ${fillClass}" style="width: ${percent}%;"></div>
          </div>
          <small class="util-text" style="font-size: 11.5px; color: var(--text-muted);">${slotsUsed} of ${budgetSlots} slots claimed</small>
        `;
        programList.appendChild(item);
      });
    } else {
      programList.innerHTML = `<div class="text-muted text-center" style="padding: 40px 0;">No active programs found.</div>`;
    }

    // 3. Render recent activities
    if (data.recent_activity && data.recent_activity.length > 0) {
      activityFeed.innerHTML = '';
      data.recent_activity.forEach(log => {
        const li = document.createElement('li');
        li.className = 'feed-item';
        li.innerHTML = `
          <div class="feed-dot"></div>
          <div class="feed-content" style="flex: 1;">
            <span class="feed-text" style="font-size: 13px; color: var(--text); display: block;">
              <strong>${escapeHtml(log.user_name)}</strong> ${escapeHtml(log.description)}
            </span>
            <span class="feed-time" style="font-size: 11.5px; color: var(--text-light); display: block; margin-top: 2px;">
              ${timeAgo(log.created_at)}
            </span>
          </div>
        `;
        activityFeed.appendChild(li);
      });
    } else {
      activityFeed.innerHTML = `<li class="text-muted text-center" style="padding: 40px 0;">No recent activities found.</li>`;
    }

  } catch (err) {
    console.error('Dashboard load error:', err);
    if (programList) {
      programList.innerHTML = `<div class="text-muted text-center" style="padding: 40px 0; color: var(--red);">Error loading dashboard stats.</div>`;
    }
  }
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

function timeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 5) return 'Just now';
  if (seconds < 60) return `${seconds} seconds ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}
