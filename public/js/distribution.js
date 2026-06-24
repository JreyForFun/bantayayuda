// js/distribution.js — Releasing terminal controller
import { apiFetch, getSession } from './api.js';

let currentApp = null;
let currentClaimCode = '';

export async function init() {
  const verifyForm = document.getElementById('form-terminal-verify');
  const claimInput = document.getElementById('terminal-claim-code');
  
  const errorAlert = document.getElementById('terminal-error');
  const successAlert = document.getElementById('terminal-success');
  const resultPanel = document.getElementById('terminal-result-panel');
  
  const resBeneficiary = document.getElementById('res-beneficiary');
  const resAddress = document.getElementById('res-address');
  const resProgram = document.getElementById('res-program');
  const resCategory = document.getElementById('res-category');
  
  const detailsInput = document.getElementById('terminal-details');
  const releaseBtn = document.getElementById('btn-terminal-release');
  const logTableBody = document.getElementById('terminal-releases-body');

  const session = getSession();

  // 1. Load Recent Releases Logs
  async function fetchReleasesLog() {
    logTableBody.innerHTML = `<tr><td colspan="4" class="text-muted text-center" style="padding: 40px 0;">Loading log...</td></tr>`;
    try {
      const logs = await apiFetch('/distributions');
      renderLogTable(logs);
    } catch (e) {
      logTableBody.innerHTML = `<tr><td colspan="4" class="text-muted text-center" style="padding: 40px 0; color: var(--red);">Failed to load release logs.</td></tr>`;
    }
  }

  function renderLogTable(logs) {
    if (logs.length === 0) {
      logTableBody.innerHTML = `<tr><td colspan="4" class="text-muted text-center" style="padding: 40px 0;">No distributions processed yet.</td></tr>`;
      return;
    }
    
    logTableBody.innerHTML = '';
    logs.forEach(row => {
      const tr = document.createElement('tr');
      const time = new Date(row.date_released).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const date = new Date(row.date_released).toLocaleDateString();
      
      tr.innerHTML = `
        <td><small class="text-muted">${date} ${time}</small></td>
        <td><strong>${escapeHtml(row.beneficiary_name)}</strong></td>
        <td><span class="badge badge-staff">${escapeHtml(row.program_name)}</span></td>
        <td><small>${escapeHtml(row.officer_name)}</small></td>
      `;
      logTableBody.appendChild(tr);
    });
  }

  // 2. Claim Code Verification submit
  verifyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    errorAlert.classList.add('d-none');
    successAlert.classList.add('d-none');
    resultPanel.classList.add('d-none');
    
    const claimCode = claimInput.value.trim().toUpperCase();
    if (!claimCode) return;

    try {
      const res = await apiFetch(`/distributions/validate/${claimCode}`);
      
      if (res.valid) {
        currentApp = res.application;
        currentClaimCode = claimCode;
        
        // Populate display
        resBeneficiary.textContent = currentApp.beneficiary_name;
        resAddress.textContent = currentApp.address || '—';
        resProgram.textContent = currentApp.program_name;
        resCategory.textContent = currentApp.category || 'Assistance';
        
        detailsInput.value = '';
        resultPanel.classList.remove('d-none');
      } else {
        throw new Error(res.error || 'Verification failed');
      }
    } catch (err) {
      errorAlert.textContent = err.message || 'Claim code is invalid or has already been released.';
      errorAlert.classList.remove('d-none');
    }
  });

  // 3. Confirm Distribution & Release
  releaseBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    if (!currentClaimCode || !currentApp) return;

    releaseBtn.disabled = true;
    releaseBtn.textContent = 'Processing release...';

    const details = detailsInput.value.trim();

    try {
      await apiFetch('/distributions', {
        method: 'POST',
        body: {
          claim_code: currentClaimCode,
          assistance_details: details || 'Handed over'
        }
      });

      // Clear layout and display success
      claimInput.value = '';
      resultPanel.classList.add('d-none');
      
      successAlert.textContent = 'Ayuda released successfully! Ledger recorded.';
      successAlert.classList.remove('d-none');
      
      // Trigger SMS simulator notification
      const officer = session ? session.user.full_name : 'Staff Officer';
      const timestamp = new Date().toLocaleString();
      const msg = `<strong>BantayAyuda LGU:</strong> Hello ${currentApp.beneficiary_name}! Your claim for ${currentApp.program_name} has been successfully <strong>Released</strong> by ${officer} on ${timestamp}. Transaction ID: <strong>${currentClaimCode}</strong>.`;
      
      window.triggerSmsSimulator(msg);

      setTimeout(() => {
        successAlert.classList.add('d-none');
      }, 5000);

      // Refresh cache and view logs
      currentApp = null;
      currentClaimCode = '';
      fetchReleasesLog();

    } catch (err) {
      alert(err.message || 'Failed to dispatch release.');
    } finally {
      releaseBtn.disabled = false;
      releaseBtn.textContent = 'Confirm & Release Ayuda';
    }
  });

  // Initial load
  fetchReleasesLog();
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
