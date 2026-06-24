// js/program.js — Programs controller
import { apiFetch, getSession } from './api.js';

let allPrograms = []; // Cache locally for editing details

export async function init() {
  const grid = document.getElementById('programs-grid');
  const categoryFilter = document.getElementById('filter-program-category');
  const statusFilter = document.getElementById('filter-program-status');
  const addBtn = document.getElementById('btn-add-program');
  
  const modal = document.getElementById('modal-program');
  const form = document.getElementById('form-program');
  const modalTitle = document.getElementById('program-modal-title');
  const statusGroup = document.getElementById('program-status-group');
  
  const inputId = document.getElementById('program-id');
  const inputName = document.getElementById('program-name');
  const inputDescription = document.getElementById('program-description');
  const inputCategory = document.getElementById('program-category');
  const inputSlots = document.getElementById('program-slots');
  const inputStartDate = document.getElementById('program-start-date');
  const inputEndDate = document.getElementById('program-end-date');
  const inputStatus = document.getElementById('program-status');

  const session = getSession();
  const isAdmin = session && session.user.role === 'admin';

  // 1. Fetch & Render Programs
  async function fetchPrograms() {
    grid.innerHTML = `<div class="text-muted text-center" style="grid-column: 1 / -1; padding: 40px 0;">Loading programs...</div>`;
    try {
      const category = categoryFilter.value;
      const status = statusFilter.value;
      
      let url = '/programs?';
      if (category && category !== 'All') url += `category=${encodeURIComponent(category)}&`;
      if (status && status !== 'All') url += `status=${encodeURIComponent(status)}&`;
      
      const records = await apiFetch(url);
      allPrograms = records;
      renderCards(records);
    } catch (err) {
      grid.innerHTML = `<div class="text-muted text-center" style="grid-column: 1 / -1; padding: 40px 0; color: var(--red);">Error loading programs.</div>`;
    }
  }

  function renderCards(records) {
    if (records.length === 0) {
      grid.innerHTML = `<div class="text-muted text-center" style="grid-column: 1 / -1; padding: 40px 0;">No programs found matching filters.</div>`;
      return;
    }
    
    grid.innerHTML = '';
    records.forEach(prog => {
      const slotsUsed = Number(prog.slots_used || 0);
      const budgetSlots = Number(prog.budget_slots || 0);
      const percent = budgetSlots > 0 ? Math.min(100, Math.round((slotsUsed / budgetSlots) * 100)) : 0;
      
      let fillClass = 'green';
      if (percent > 85) fillClass = 'red';
      else if (percent > 60) fillClass = 'yellow';
      
      const statusBadge = prog.status === 'active' ? 'badge-active' : 'badge-closed';
      const actionButtons = `
        <div class="program-card-actions">
          <button class="btn btn-sm btn-outline edit-program" data-id="${prog.id}">Edit</button>
          ${isAdmin ? `<button class="btn btn-sm btn-danger delete-program" style="padding: 4px 10px;" data-id="${prog.id}">Delete</button>` : ''}
        </div>
      `;
      
      const card = document.createElement('div');
      card.className = 'program-card';
      card.innerHTML = `
        <div class="program-card-header">
          <span class="badge ${statusBadge}">${escapeHtml(prog.status)}</span>
          <span class="badge badge-admin">${escapeHtml(prog.category)}</span>
        </div>
        <div class="program-card-title">${escapeHtml(prog.name)}</div>
        <div class="program-card-desc">${escapeHtml(prog.description || 'No description provided.')}</div>
        <div style="font-size: 12px; color: var(--text-muted); display: flex; justify-content: space-between;">
          <span><strong>Slots:</strong> ${slotsUsed} / ${budgetSlots} Filled</span>
          <span><strong>Code:</strong> ${prog.program_code}</span>
        </div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill ${fillClass}" style="width: ${percent}%;"></div>
        </div>
        <div class="divider" style="margin: 8px 0;"></div>
        ${actionButtons}
      `;
      grid.appendChild(card);
    });
  }

  // 2. Filter Event Listeners
  categoryFilter.addEventListener('change', fetchPrograms);
  statusFilter.addEventListener('change', fetchPrograms);

  // 3. Modal Actions
  addBtn.addEventListener('click', () => {
    form.reset();
    inputId.value = '';
    modalTitle.textContent = 'Create Assistance Program';
    statusGroup.classList.add('d-none');
    
    // Default dates (today to +30 days)
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setDate(today.getDate() + 30);
    
    inputStartDate.value = today.toISOString().split('T')[0];
    inputEndDate.value = nextMonth.toISOString().split('T')[0];
    
    modal.classList.add('open');
  });

  modal.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      modal.classList.remove('open');
    });
  });

  // 4. Form Submit Handler (Save / Update)
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = inputId.value;
    const body = {
      name: inputName.value.trim(),
      description: inputDescription.value.trim(),
      category: inputCategory.value,
      budget_slots: Number(inputSlots.value),
      start_date: inputStartDate.value,
      end_date: inputEndDate.value,
      status: id ? inputStatus.value : 'active'
    };

    const saveBtn = document.getElementById('btn-save-program');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
      if (id) {
        await apiFetch(`/programs/${id}`, {
          method: 'PUT',
          body
        });
      } else {
        await apiFetch('/programs', {
          method: 'POST',
          body
        });
      }
      modal.classList.remove('open');
      fetchPrograms();
    } catch (err) {
      alert(err.message || 'Failed to save program.');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Program';
    }
  });

  // 5. Grid Actions (Edit / Delete delegation)
  grid.addEventListener('click', async (e) => {
    const editBtn = e.target.closest('.edit-program');
    const deleteBtn = e.target.closest('.delete-program');
    
    if (editBtn) {
      const id = editBtn.getAttribute('data-id');
      const item = allPrograms.find(p => String(p.id) === String(id));
      if (!item) return;

      inputId.value = item.id;
      inputName.value = item.name;
      inputDescription.value = item.description || '';
      inputCategory.value = item.category;
      inputSlots.value = item.budget_slots;
      
      if (item.start_date) inputStartDate.value = item.start_date.split('T')[0];
      if (item.end_date) inputEndDate.value = item.end_date.split('T')[0];
      
      inputStatus.value = item.status;
      
      modalTitle.textContent = 'Edit Assistance Program';
      statusGroup.classList.remove('d-none');
      modal.classList.add('open');
    }
    
    if (deleteBtn) {
      const id = deleteBtn.getAttribute('data-id');
      const item = allPrograms.find(p => String(p.id) === String(id));
      if (!item) return;

      if (confirm(`Are you sure you want to delete program "${item.name}"?`)) {
        try {
          await apiFetch(`/programs/${id}`, { method: 'DELETE' });
          fetchPrograms();
        } catch (err) {
          alert(err.message || 'Failed to delete program.');
        }
      }
    }
  });

  // Initial load
  fetchPrograms();
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
