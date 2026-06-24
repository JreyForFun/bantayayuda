// js/beneficiary.js — Beneficiary controller
import { apiFetch, getSession } from './api.js';

let allBeneficiaries = []; // Cache list for editing locally
let duplicateDebounceTimer = null;

export async function init() {
  const tableBody = document.getElementById('beneficiaries-list-body');
  const searchInput = document.getElementById('search-beneficiary');
  const categoryFilter = document.getElementById('filter-beneficiary-category');
  const addBtn = document.getElementById('btn-add-beneficiary');
  
  const modal = document.getElementById('modal-beneficiary');
  const form = document.getElementById('form-beneficiary');
  const modalTitle = document.getElementById('beneficiary-modal-title');
  const warningBanner = document.getElementById('duplicate-warning');
  
  const inputId = document.getElementById('beneficiary-id');
  const inputName = document.getElementById('beneficiary-name');
  const inputAddress = document.getElementById('beneficiary-address');
  const inputContact = document.getElementById('beneficiary-contact');
  const inputBirthdate = document.getElementById('beneficiary-birthdate');
  const inputCategory = document.getElementById('beneficiary-category');
  const inputStatus = document.getElementById('beneficiary-status');
  const statusGroup = document.getElementById('status-group');

  const session = getSession();
  const isAdmin = session && session.user.role === 'admin';

  // 1. Fetch & Render records
  async function fetchRecords() {
    tableBody.innerHTML = `<tr><td colspan="7" class="text-muted text-center" style="padding: 40px 0;">Loading records...</td></tr>`;
    try {
      const search = searchInput.value.trim();
      const category = categoryFilter.value;
      
      let url = '/beneficiaries?';
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (category && category !== 'All') url += `category=${encodeURIComponent(category)}&`;
      
      const records = await apiFetch(url);
      allBeneficiaries = records;
      renderTable(records);
    } catch (err) {
      tableBody.innerHTML = `<tr><td colspan="7" class="text-muted text-center" style="padding: 40px 0; color: var(--red);">Error loading records.</td></tr>`;
    }
  }

  function renderTable(records) {
    if (records.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" class="text-muted text-center" style="padding: 40px 0;">No beneficiaries found.</td></tr>`;
      return;
    }
    
    tableBody.innerHTML = '';
    records.forEach(row => {
      const tr = document.createElement('tr');
      
      const statusBadgeClass = row.status === 'active' ? 'badge-active' : 'badge-closed';
      const actionButtons = `
        <div class="table-actions">
          <button class="btn-action edit" data-id="${row.id}">Edit</button>
          ${isAdmin ? `<button class="btn-action delete" data-id="${row.id}">Delete</button>` : ''}
        </div>
      `;
      
      tr.innerHTML = `
        <td><strong>${escapeHtml(row.beneficiary_code)}</strong></td>
        <td>${escapeHtml(row.full_name)}</td>
        <td>${escapeHtml(row.address)}</td>
        <td>${escapeHtml(row.contact_number)}</td>
        <td><span class="badge badge-staff">${escapeHtml(row.assistance_category)}</span></td>
        <td><span class="badge ${statusBadgeClass}">${escapeHtml(row.status)}</span></td>
        <td>${actionButtons}</td>
      `;
      
      tableBody.appendChild(tr);
    });
  }

  // 2. Event Listeners for Filters
  searchInput.addEventListener('input', debounce(fetchRecords, 300));
  categoryFilter.addEventListener('change', fetchRecords);

  // 3. Modal Controls
  addBtn.addEventListener('click', () => {
    form.reset();
    inputId.value = '';
    modalTitle.textContent = 'Register Beneficiary';
    warningBanner.classList.add('d-none');
    statusGroup.classList.add('d-none'); // Hide status on creation (always active)
    modal.classList.add('open');
  });

  // Delegate click for close-modal
  modal.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      modal.classList.remove('open');
    });
  });

  // 4. Duplicate Name Check
  inputName.addEventListener('input', () => {
    clearTimeout(duplicateDebounceTimer);
    const name = inputName.value.trim();
    if (name.length < 3) {
      warningBanner.classList.add('d-none');
      return;
    }

    duplicateDebounceTimer = setTimeout(async () => {
      try {
        const res = await apiFetch(`/beneficiaries/check-duplicate?name=${encodeURIComponent(name)}`);
        
        // If we're updating, ignore matching the beneficiary we are currently editing
        const editingId = inputId.value;
        const isDuplicate = res.duplicate && res.matches.some(m => String(m.id) !== String(editingId));
        
        if (isDuplicate) {
          warningBanner.classList.remove('d-none');
        } else {
          warningBanner.classList.add('d-none');
        }
      } catch (e) {
        console.warn('Duplicate check error:', e);
      }
    }, 400);
  });

  // 5. Submit Form (Save/Update)
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = inputId.value;
    const body = {
      name: inputName.value.trim(),
      address: inputAddress.value.trim(),
      contact: inputContact.value.trim(),
      birthdate: inputBirthdate.value,
      category: inputCategory.value,
      status: id ? inputStatus.value : 'active'
    };

    const saveBtn = document.getElementById('btn-save-beneficiary');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
      if (id) {
        // Update
        await apiFetch(`/beneficiaries/${id}`, {
          method: 'PUT',
          body
        });
      } else {
        // Create
        await apiFetch('/beneficiaries', {
          method: 'POST',
          body
        });
      }
      modal.classList.remove('open');
      fetchRecords();
    } catch (err) {
      alert(err.message || 'Failed to save beneficiary profile.');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Beneficiary';
    }
  });

  // 6. Action Handlers (Edit/Delete inside table)
  tableBody.addEventListener('click', async (e) => {
    const editBtn = e.target.closest('.btn-action.edit');
    const deleteBtn = e.target.closest('.btn-action.delete');
    
    if (editBtn) {
      const id = editBtn.getAttribute('data-id');
      const item = allBeneficiaries.find(b => String(b.id) === String(id));
      if (!item) return;

      // Populate Form
      inputId.value = item.id;
      inputName.value = item.full_name;
      inputAddress.value = item.address;
      inputContact.value = item.contact_number;
      
      // format date as YYYY-MM-DD
      if (item.birthdate) {
        inputBirthdate.value = item.birthdate.split('T')[0];
      }
      
      inputCategory.value = item.assistance_category;
      inputStatus.value = item.status;
      
      modalTitle.textContent = 'Edit Beneficiary Profile';
      warningBanner.classList.add('d-none');
      statusGroup.classList.remove('d-none'); // Show status selection on edit
      modal.classList.add('open');
    }
    
    if (deleteBtn) {
      const id = deleteBtn.getAttribute('data-id');
      const item = allBeneficiaries.find(b => String(b.id) === String(id));
      if (!item) return;

      if (confirm(`Are you sure you want to delete beneficiary "${item.full_name}"?`)) {
        try {
          await apiFetch(`/beneficiaries/${id}`, { method: 'DELETE' });
          fetchRecords();
        } catch (err) {
          alert(err.message || 'Failed to delete beneficiary.');
        }
      }
    }
  });

  // Load initial dataset
  fetchRecords();
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

function debounce(func, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
}
