// js/application.js — Applications controller
import { apiFetch, getSession } from './api.js';

let allApplications = [];

export async function init() {
  const tableBody = document.getElementById('applications-list-body');
  const statusFilter = document.getElementById('filter-app-status');
  const programFilter = document.getElementById('filter-app-program');
  const addBtn = document.getElementById('btn-add-application');
  
  const modalApp = document.getElementById('modal-application');
  const formApp = document.getElementById('form-application');
  const selectBeneficiary = document.getElementById('app-beneficiary-id');
  const selectProgram = document.getElementById('app-program-id');
  
  const modalSlip = document.getElementById('modal-claim-slip');
  const printBtn = document.getElementById('btn-print-voucher');
  
  const session = getSession();
  const isAdmin = session && session.user.role === 'admin';

  // 1. Load active programs for filter dropdown
  async function loadFilterPrograms() {
    try {
      const programs = await apiFetch('/programs');
      programFilter.innerHTML = '<option value="All">All Programs</option>';
      programs.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `${p.program_code} - ${p.name}`;
        programFilter.appendChild(opt);
      });
    } catch (e) {
      console.warn('Failed to load filter programs:', e);
    }
  }

  // 2. Fetch & Render Applications
  async function fetchApplications() {
    tableBody.innerHTML = `<tr><td colspan="7" class="text-muted text-center" style="padding: 40px 0;">Loading records...</td></tr>`;
    try {
      const status = statusFilter.value;
      const programId = programFilter.value;
      
      let url = '/applications?';
      if (status && status !== 'All') url += `status=${encodeURIComponent(status)}&`;
      if (programId && programId !== 'All') url += `program_id=${encodeURIComponent(programId)}&`;
      
      const records = await apiFetch(url);
      allApplications = records;
      renderTable(records);
    } catch (err) {
      tableBody.innerHTML = `<tr><td colspan="7" class="text-muted text-center" style="padding: 40px 0; color: var(--red);">Error loading applications.</td></tr>`;
    }
  }

  function renderTable(records) {
    if (records.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" class="text-muted text-center" style="padding: 40px 0;">No applications found.</td></tr>`;
      return;
    }
    
    tableBody.innerHTML = '';
    records.forEach(row => {
      const tr = document.createElement('tr');
      
      // Status Badge
      let badgeClass = 'badge-pending';
      if (row.status === 'approved') badgeClass = 'badge-approved';
      else if (row.status === 'rejected') badgeClass = 'badge-rejected';
      else if (row.status === 'released') badgeClass = 'badge-released';
      
      // Action Buttons based on status & role
      let actions = '';
      if (row.status === 'pending') {
        if (isAdmin) {
          actions = `
            <button class="btn-action edit approve-btn" style="color: var(--green); border-color: var(--green-light);" data-id="${row.id}">Approve</button>
            <button class="btn-action delete reject-btn" data-id="${row.id}">Reject</button>
          `;
        } else {
          actions = `<span class="text-muted">Pending Admin Review</span>`;
        }
        if (isAdmin) {
          actions += ` <button class="btn-action delete-app-btn" style="color: var(--text-light);" data-id="${row.id}">✕</button>`;
        }
      } else if (row.status === 'approved') {
        actions = `
          <button class="btn-action edit print-btn" data-id="${row.id}">Voucher</button>
          <button class="btn-action edit release-btn" style="color: var(--green); border-color: var(--green-light);" data-id="${row.id}">Release</button>
        `;
      } else if (row.status === 'released') {
        actions = `
          <button class="btn-action edit print-btn" data-id="${row.id}">View Receipt</button>
        `;
      }
      
      const claimCode = row.claim_code ? `<code>${row.claim_code}</code>` : `<span class="text-muted">—</span>`;
      const appliedDate = new Date(row.applied_at).toLocaleDateString();
      
      tr.innerHTML = `
        <td><strong>${escapeHtml(row.application_code)}</strong></td>
        <td>${escapeHtml(row.beneficiary_name)} <br><small class="text-muted">${row.beneficiary_code}</small></td>
        <td>${escapeHtml(row.program_name)}</td>
        <td>${appliedDate}</td>
        <td><span class="badge ${badgeClass}">${escapeHtml(row.status)}</span></td>
        <td>${claimCode}</td>
        <td><div class="table-actions">${actions}</div></td>
      `;
      
      tableBody.appendChild(tr);
    });
  }

  // 3. Event Listeners for Filters
  statusFilter.addEventListener('change', fetchApplications);
  programFilter.addEventListener('change', fetchApplications);

  // 4. Submit Modal Populator
  addBtn.addEventListener('click', async () => {
    formApp.reset();
    selectBeneficiary.innerHTML = '<option value="" disabled selected>Loading beneficiaries...</option>';
    selectProgram.innerHTML = '<option value="" disabled selected>Loading active programs...</option>';
    modalApp.classList.add('open');

    try {
      // Fetch active programs
      const programs = await apiFetch('/programs?status=active');
      selectProgram.innerHTML = '<option value="" disabled selected>Select Program</option>';
      programs.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `${p.name} (${p.budget_slots - p.slots_used} slots left)`;
        selectProgram.appendChild(opt);
      });
      
      // Fetch active beneficiaries
      const beneficiaries = await apiFetch('/beneficiaries');
      const activeBeneficiaries = beneficiaries.filter(b => b.status === 'active');
      selectBeneficiary.innerHTML = '<option value="" disabled selected>Select Beneficiary</option>';
      activeBeneficiaries.forEach(b => {
        const opt = document.createElement('option');
        opt.value = b.id;
        opt.textContent = `${b.full_name} (${b.beneficiary_code})`;
        selectBeneficiary.appendChild(opt);
      });
    } catch (err) {
      console.error(err);
      alert('Failed to load selection data.');
    }
  });

  modalApp.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => modalApp.classList.remove('open'));
  });

  modalSlip.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => modalSlip.classList.remove('open'));
  });

  // Submit Application handler
  formApp.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById('btn-save-application');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Submitting...';

    const body = {
      beneficiary_id: Number(selectBeneficiary.value),
      program_id: Number(selectProgram.value),
      notes: document.getElementById('app-notes').value.trim()
    };

    try {
      await apiFetch('/applications', {
        method: 'POST',
        body
      });
      modalApp.classList.remove('open');
      fetchApplications();
    } catch (err) {
      alert(err.message || 'Failed to submit application.');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Submit Request';
    }
  });

  // Print voucher execution
  printBtn.addEventListener('click', () => {
    window.print();
  });

  // 5. Actions Handlers (Approve, Reject, Print, Release, Delete)
  tableBody.addEventListener('click', async (e) => {
    const id = e.target.getAttribute('data-id');
    if (!id) return;

    const row = allApplications.find(a => String(a.id) === String(id));
    if (!row) return;

    // Approve handler
    if (e.target.classList.contains('approve-btn')) {
      if (confirm(`Approve application for "${row.beneficiary_name}" under program "${row.program_name}"?`)) {
        try {
          const res = await apiFetch(`/applications/${id}/status`, {
            method: 'PATCH',
            body: { status: 'approved' }
          });
          
          fetchApplications();
          
          // Trigger SMS Simulator Notification
          const msg = `<strong>BantayAyuda LGU:</strong> Hello ${row.beneficiary_name}! Your application for ${row.program_name} has been <strong>Approved</strong>. <br>Claim Code: <strong>${res.claim_code}</strong>. Present this pass at releasing terminals.`;
          window.triggerSmsSimulator(msg);
        } catch (err) {
          alert(err.message || 'Failed to approve application.');
        }
      }
    }

    // Reject handler
    if (e.target.classList.contains('reject-btn')) {
      const reason = prompt(`Enter rejection reason for "${row.beneficiary_name}":`);
      if (reason === null) return; // cancelled
      
      try {
        await apiFetch(`/applications/${id}/status`, {
          method: 'PATCH',
          body: { status: 'rejected', notes: reason }
        });
        
        fetchApplications();
        
        // Trigger SMS Simulator Notification
        const msg = `<strong>BantayAyuda LGU:</strong> Hello ${row.beneficiary_name}. We regret to inform you that your application for ${row.program_name} has been <strong>Rejected</strong>. <br>Reason: ${reason || 'Criteria mismatch'}.`;
        window.triggerSmsSimulator(msg);
      } catch (err) {
        alert(err.message || 'Failed to reject application.');
      }
    }

    // Print Pass click handler
    if (e.target.classList.contains('print-btn')) {
      document.getElementById('claim-pass-code').textContent = row.claim_code || 'PENDING';
      document.getElementById('claim-pass-beneficiary').textContent = row.beneficiary_name;
      document.getElementById('claim-pass-program').textContent = row.program_name;
      document.getElementById('claim-pass-category').textContent = row.program_category || 'Assistance';
      document.getElementById('claim-pass-qr-text').textContent = row.claim_code || 'PENDING';
      
      modalSlip.classList.add('open');
    }

    // Direct Release click handler
    if (e.target.classList.contains('release-btn')) {
      if (confirm(`Mark items as RELEASED for "${row.beneficiary_name}"?`)) {
        try {
          await apiFetch(`/applications/${id}/status`, {
            method: 'PATCH',
            body: { status: 'released' }
          });
          
          fetchApplications();
          
          const officer = session ? session.user.full_name : 'Staff Officer';
          const msg = `<strong>BantayAyuda LGU:</strong> Hello ${row.beneficiary_name}! Your assistance for ${row.program_name} has been successfully <strong>Released</strong> by ${officer}. Transaction ID: ${row.claim_code}.`;
          window.triggerSmsSimulator(msg);
        } catch (err) {
          alert(err.message || 'Failed to release application assistance.');
        }
      }
    }

    // Delete application handler
    if (e.target.classList.contains('delete-app-btn')) {
      if (confirm('Delete this application record permanently?')) {
        try {
          await apiFetch(`/applications/${id}`, { method: 'DELETE' });
          fetchApplications();
        } catch (err) {
          alert(err.message || 'Failed to delete application record.');
        }
      }
    }
  });

  // Load datasets
  await loadFilterPrograms();
  await fetchApplications();
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
