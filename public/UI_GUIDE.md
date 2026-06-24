# 🎨 BantayAyuda Frontend UI Elements & Layout Guide

This document lists the exact HTML elements, input fields, forms, and IDs for each screen so the team can build the frontend consistently.

---

## 1. Global Navigation Shell (`public/dashboard.html`)
This is the master wrapper for all pages except the login screen.

```
+--------------------------------------------------------------+
| Logo: BantayAyuda               | Header: Welcome, [User]    |
+---------------------------------| Current Role: Admin/Staff  |
| 📊 Dashboard                     | [Logout Button]            |
| 👥 Beneficiaries                +----------------------------+
| 📋 Programs                     |                            |
| ✉️ Applications                 |       Viewport Area        |
| 🎫 Distribution Terminal        |     (Dynamic Content)      |
| 📈 Reports                      |                            |
| 🔑 Audit Logs (Admin Only)      |                            |
+---------------------------------+----------------------------+
```

### Key Elements:
*   **Sidebar `<aside class="sidebar">`:**
    *   Logo: `<div class="logo">BantayAyuda</div>`
    *   Menu items list: `<nav class="nav-menu">` containing `<a>` tags with `class="nav-link"` and specific IDs:
        *   `#nav-dashboard`
        *   `#nav-beneficiaries`
        *   `#nav-programs`
        *   `#nav-applications`
        *   `#nav-distribution`
        *   `#nav-reports`
        *   `#nav-audit-log` *(only visible if user role is `admin`)*
*   **Top Bar `<header class="top-header">`:**
    *   Page title: `<h1 id="current-page-title">Dashboard</h1>`
    *   User info: `<span id="user-display-name">Welcome, Loading...</span>`
    *   Logout button: `<button id="btn-logout" class="btn btn-outline">Logout</button>`
*   **Viewport Container:**
    *   `<main id="viewport" class="content-viewport"></main>`

---

## 2. Login Screen (`public/index.html`)

```
+------------------------------------+
|            BantayAyuda             |
|   "Walang Maiiwan, Walang Makukulong"|
|                                    |
|  Username: [____________________]  |
|  Password: [____________________]  |
|                                    |
|  [ Login Button ]                  |
|  [ Error Message Display Area ]    |
+------------------------------------+
```

### Form Fields & IDs:
*   **Container:** `<div class="login-container">` inside a centered flex layout.
*   **Form:** `<form id="login-form">`
    *   Username Input: `<input type="text" id="login-username" required placeholder="Enter username">`
    *   Password Input: `<input type="password" id="login-password" required placeholder="Enter password">`
    *   Submit Button: `<button type="submit" class="btn btn-primary btn-block">Access System</button>`
    *   Error Display: `<div id="login-error" class="alert alert-danger d-none"></div>`

---

## 3. Dashboard View (`public/pages/dashboard.html`)

### A. Statistics Cards (Grid Layout)
*   **Card 1 (Total Beneficiaries):** `<div class="card-stat">` with count element `<h3 id="stat-total-beneficiaries">0</h3>`
*   **Card 2 (Total Programs):** with count element `<h3 id="stat-total-programs">0</h3>`
*   **Card 3 (Total Applications):** with count element `<h3 id="stat-total-applications">0</h3>`
*   **Card 4 (Approved Applications):** with count element `<h3 id="stat-approved-applications">0</h3>`
*   **Card 5 (Released Distributions):** with count element `<h3 id="stat-released-distributions">0</h3>`

### B. Program Capacity Bars
*   **Container:** `<div id="dashboard-programs-utilization" class="utilization-list">`
*   Dynamic layout template for each program:
    ```html
    <div class="program-util-item">
      <div class="util-header">
        <span class="program-name">Scholarship Grant 2024</span>
        <span class="util-percent">65%</span>
      </div>
      <div class="progress-bar-bg">
        <div class="progress-bar-fill green" style="width: 65%;"></div> <!-- Classes: green, yellow, red -->
      </div>
      <small class="util-text">65 of 100 slots claimed</small>
    </div>
    ```

### C. Live Activity Stream (Recent Audit Logs)
*   **Container:** `<ul id="dashboard-recent-activities" class="activity-feed">`
*   Item layout: `<li class="feed-item"> <span class="feed-time">10 mins ago</span> <span class="feed-text">Admin approved Application APP-02</span> </li>`

---

## 4. Beneficiary View (`public/pages/beneficiaries.html`)

### A. Search & Action Bar
*   Search input: `<input type="text" id="search-beneficiary" placeholder="Search by name, address, or ID...">`
*   Category filter: `<select id="filter-beneficiary-category">` (Options: All, Scholarship, Medical, Relief, Livelihood)
*   Create button: `<button id="btn-add-beneficiary" class="btn btn-primary">+ Register Beneficiary</button>`

### B. Records Table
*   Table structure: `<table class="table" id="table-beneficiaries">`
*   Headers: `ID | Code | Name | Address | Contact | Category | Status | Actions`
*   Action Buttons (inside `<td>`):
    *   `<button class="btn-action edit" data-id="${id}">Edit</button>`
    *   `<button class="btn-action delete admin-only" data-id="${id}">Delete</button>`

### C. Add/Edit Modal (`#modal-beneficiary`)
*   **Container:** `<div id="modal-beneficiary" class="modal">`
*   **Form:** `<form id="form-beneficiary">`
    *   Hidden Input for ID (for updates): `<input type="hidden" id="beneficiary-id">`
    *   Full Name: `<input type="text" id="beneficiary-name" required>`
    *   Address: `<input type="text" id="beneficiary-address" required>`
    *   Contact Number: `<input type="text" id="beneficiary-contact" required>`
    *   Birthdate: `<input type="date" id="beneficiary-birthdate" required>`
    *   Category: `<select id="beneficiary-category" required>`
    *   Status: `<select id="beneficiary-status">` (Active / Inactive)
    *   **Duplicate Warning Banner (Innovation):** `<div id="duplicate-warning" class="warning-banner d-none">⚠️ A beneficiary with this name is already registered. Please check records.</div>`
    *   Actions: `<button type="submit" class="btn btn-primary">Save Beneficiary</button>` and `<button type="button" class="btn btn-secondary close-modal">Cancel</button>`

---

## 5. Programs View (`public/pages/programs.html`)

### A. Filters & Create Button
*   Status Filter: `<select id="filter-program-status">` (Options: All, Active, Closed)
*   Category Filter: `<select id="filter-program-category">`
*   Create Program Button: `<button id="btn-add-program" class="btn btn-primary">+ Create Program</button>`

### B. Program Cards Grid
*   **Grid:** `<div id="programs-grid" class="cards-grid">`
*   Card Template:
    ```html
    <div class="card-program">
      <span class="badge badge-active">Active</span>
      <h3>Medical Assistance Fund</h3>
      <p class="description">Emergency cash assistance for medical operations.</p>
      <div class="program-meta">
        <strong>Slots:</strong> 40 / 50 Filled
      </div>
      <div class="progress-bar-bg"><div class="progress-bar-fill yellow" style="width: 80%"></div></div>
      <div class="card-actions">
        <button class="btn btn-sm btn-outline edit-program" data-id="1">Edit</button>
        <button class="btn btn-sm btn-danger delete-program admin-only" data-id="1">Delete</button>
      </div>
    </div>
    ```

---

## 6. Applications View (`public/pages/applications.html`)

### A. Table Filters
*   Status Filter: `<select id="filter-app-status">` (Options: All, Pending, Approved, Rejected, Released)
*   Program Filter: `<select id="filter-app-program">`
*   Submit Application: `<button id="btn-add-application" class="btn btn-primary">New Application</button>`

### B. Application Table
*   Table: `<table class="table" id="table-applications">`
*   Headers: `Code | Beneficiary Name | Program | Date Applied | Status | Claim Code | Actions`
*   Status badges dynamically rendered:
    *   `<span class="badge badge-pending">Pending</span>`
    *   `<span class="badge badge-approved">Approved</span>`
    *   `<span class="badge badge-rejected">Rejected</span>`
    *   `<span class="badge badge-released">Released</span>`
*   Actions (based on status):
    *   **Pending:** Approve button, Reject button, Edit, Delete
    *   **Approved:** "Print Claim Pass" button, Release button
    *   **Released:** "View Receipt" button

### C. Printable Claim Slip Modal (`#modal-claim-slip`)
*   Contains the printable claim slip voucher layout:
    ```html
    <div class="claim-slip-print-area">
      <h2>BANTAYAYUDA CLAIM SLIP</h2>
      <hr>
      <p><strong>Claim Code:</strong> <span class="claim-code-text">BA-2026-X9K2</span></p>
      <p><strong>Beneficiary:</strong> <span class="claim-beneficiary">Juan Dela Cruz</span></p>
      <p><strong>Program:</strong> <span class="claim-program">Rice Relief Pack</span></p>
      <p><strong>Assistance Category:</strong> <span class="claim-category">Relief Distribution</span></p>
      <hr>
      <div class="qr-mock-placeholder">
        <!-- Rendered QR or barcode style border -->
        [ MOCK QR CODE ]
      </div>
      <p><small>Present this code or QR at the releasing terminal to claim your items.</small></p>
      <button class="btn btn-primary no-print" onclick="window.print()">🖨️ Print Voucher</button>
    </div>
    ```

---

## 7. Releasing Terminal View (`public/pages/distribution.html`)

```
+-------------------------------------------------+
|               RELEASING TERMINAL                |
|  Enter Claim Code: [ BA-2026-X9K2             ] |
|                      [ Verify Claim ]           |
+-------------------------------------------------+
|  [ VERIFICATION CARD ]                          |
|  Beneficiary: Juan Dela Cruz                    |
|  Program: Rice Relief Pack                      |
|  Status: APPROVED (Ready for Claim)             |
|  Notes: Verified LGU resident                   |
|                                                 |
|  [ CONFIRM DISTRIBUTION / RELEASE AYUDA ]       |
+-------------------------------------------------+
```

### Key Elements:
*   **Search Box:** `<input type="text" id="terminal-claim-code" placeholder="Enter Claim Code (e.g. BA-XXXX-XXXX)">`
*   **Verify Button:** `<button id="btn-terminal-verify" class="btn btn-primary">Verify Claim</button>`
*   **Result Panel:** `<div id="terminal-result-panel" class="d-none">`
    *   Holds verification card and status checks.
    *   Releasing button: `<button id="btn-terminal-release" class="btn btn-success btn-block">Confirm & Release Ayuda</button>`
*   **Notification Simulator Widget (Floating / Sidebar Drawer):**
    *   `<div id="sms-simulator-phone" class="phone-container">`
    *   Simulates a smartphone screen flashing a message:
        > 💬 **BantayAyuda LGU:** Hello [Name]! Your claim for [Program] has been successfully **Released** by [Releasing Officer] on [Timestamp]. Transaction ID: [Code].

---

## 8. Reports View (`public/pages/reports.html`)

### Key Elements:
*   Report Selector: `<select id="report-type">`
    *   `beneficiary_list`
    *   `application_status`
    *   `program_utilization`
*   Filters: `<input type="date" id="report-start">` to `<input type="date" id="report-end">`
*   `Export / Print` button: `<button id="btn-print-report" class="btn btn-outline">🖨️ Generate & Print Report</button>`
*   **Report Body Container:** `<div id="report-print-container">` (gets printable classes applied when printing).
