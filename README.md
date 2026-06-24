# 🤝 BantayAyuda — Community Assistance Management System

> *"Walang Maiiwan, Walang Makukulong"*  
> No one left behind. No one gets double.

**BantayAyuda** is a digital platform designed for Local Government Units (LGUs), schools, and community organizations to streamline the management of assistance programs — eliminating duplicate claims, manual paperwork, and lack of accountability.

---

## 🏆 Built For
**CodeX Hackathon — Community Assistance Management System (CAMS) Challenge**

---

## 👥 Team
> Add team member names here

---

## 🧰 Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Backend** | Node.js + Express | Simple, fast REST API — pure JavaScript |
| **Database** | Turso (cloud SQLite via libSQL) | Modern edge DB, serverless, SQL-based |
| **Frontend** | Vanilla HTML + CSS + JavaScript | No build process, easy to modify live |
| **Auth** | Session-based (in-memory Map) | Simple, explainable, no external deps |

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create a `.env` file in the root:
```env
PORT=3000
TURSO_URL=your_turso_database_url
TURSO_TOKEN=your_turso_auth_token
SESSION_SECRET=bantayayuda_secret_2024
```

### 3. Create Database Tables + Seed Data
```bash
node database/schema.js
```
This creates all tables and seeds:
- Admin account: `admin` / `admin123`
- Staff account: `staff` / `staff123`
- Sample programs and beneficiaries

### 4. Start the Server
```bash
# Development (auto-restart on file change)
npm run dev

# Production
npm start
```

### 5. Open in Browser
```
http://localhost:3000
```

---

## 📁 Folder Structure

```
bantayayuda/
├── .env                          # Environment variables (Turso URL + Token)
├── .gitignore                    # Ignore node_modules and .env
├── package.json                  # Project config and dependencies
├── server.js                     # Entry point — Express app + route mounting
│
├── database/
│   ├── db.js                     # Turso client instance (singleton)
│   └── schema.js                 # CREATE TABLE statements + seed data
│
├── routes/                       # One file per feature module
│   ├── auth.routes.js            # POST /api/auth/login, /logout, /me
│   ├── beneficiary.routes.js     # CRUD /api/beneficiaries
│   ├── program.routes.js         # CRUD /api/programs
│   ├── application.routes.js     # CRUD /api/applications + status change
│   ├── distribution.routes.js    # POST /api/distributions (release claim)
│   ├── dashboard.routes.js       # GET /api/dashboard/stats
│   └── report.routes.js          # GET /api/reports
│
├── middleware/
│   └── auth.js                   # Session check + role guard (admin/staff)
│
└── public/                       # Everything served statically
    ├── index.html                # Login page (no auth required)
    ├── dashboard.html            # Main app shell (requires auth)
    │
    ├── pages/                    # HTML partials loaded dynamically
    │   ├── dashboard.html        # Dashboard stats + activity feed
    │   ├── beneficiaries.html    # Beneficiary list + add/edit forms
    │   ├── programs.html         # Program cards + utilization bars
    │   ├── applications.html     # Application table + status manager
    │   ├── distribution.html     # Release terminal + recent releases
    │   ├── reports.html          # Printable reports
    │   └── audit-log.html        # Admin-only activity log
    │
    ├── css/
    │   ├── style.css             # CSS variables, reset, global typography
    │   ├── layout.css            # Sidebar, header, page grid
    │   ├── components.css        # Buttons, badges, cards, modals, forms
    │   └── table.css             # Table styles, search bar, filters
    │
    └── js/
        ├── api.js                # Centralized fetch() wrapper for all API calls
        ├── auth.js               # Login page: form submit, error display
        ├── app.js                # Main router: sidebar nav, load pages, session check
        ├── dashboard.js          # Fetch stats, render cards, auto-refresh
        ├── beneficiary.js        # List, add, edit, delete, DUPLICATE CHECKER
        ├── program.js            # List, add, edit, delete, utilization bars
        ├── application.js        # List, filter, add, change status, CLAIM SLIP
        ├── distribution.js       # Release terminal: enter code, validate, confirm
        ├── report.js             # Fetch report data, render table, print
        └── audit-log.js          # Fetch and render activity log (admin only)
```

---

## 🗄️ Database Schema

### `users`
| Column | Type | Description |
|---|---|---|
| id | INTEGER PK | Auto-increment |
| username | TEXT | Unique login name |
| password | TEXT | Hashed password |
| full_name | TEXT | Display name |
| role | TEXT | `admin` or `staff` |
| created_at | TEXT | Timestamp |

### `beneficiaries`
| Column | Type | Description |
|---|---|---|
| id | INTEGER PK | Auto-increment |
| beneficiary_code | TEXT | Unique code (e.g. `BEN-001`) |
| full_name | TEXT | Full name |
| address | TEXT | Barangay / City / Province |
| contact_number | TEXT | Phone number |
| birthdate | TEXT | Date of birth |
| assistance_category | TEXT | Scholarship / Medical / Relief / Livelihood |
| status | TEXT | `active` or `inactive` |
| created_at | TEXT | Timestamp |
| created_by | INTEGER | FK → users.id |

### `programs`
| Column | Type | Description |
|---|---|---|
| id | INTEGER PK | Auto-increment |
| program_code | TEXT | Unique code (e.g. `PROG-001`) |
| name | TEXT | Program name |
| description | TEXT | What the program covers |
| category | TEXT | Scholarship / Medical / Relief / Livelihood |
| budget_slots | INTEGER | Max number of beneficiaries |
| start_date | TEXT | Date |
| end_date | TEXT | Date |
| status | TEXT | `active` or `closed` |
| created_at | TEXT | Timestamp |
| created_by | INTEGER | FK → users.id |

### `applications`
| Column | Type | Description |
|---|---|---|
| id | INTEGER PK | Auto-increment |
| application_code | TEXT | Unique code (e.g. `APP-001`) |
| beneficiary_id | INTEGER | FK → beneficiaries.id |
| program_id | INTEGER | FK → programs.id |
| status | TEXT | `pending` / `approved` / `rejected` / `released` |
| claim_code | TEXT | Unique release code (generated on approval) |
| notes | TEXT | Reviewer notes |
| applied_at | TEXT | Timestamp |
| reviewed_at | TEXT | Timestamp |
| reviewed_by | INTEGER | FK → users.id |

### `distributions`
| Column | Type | Description |
|---|---|---|
| id | INTEGER PK | Auto-increment |
| application_id | INTEGER | FK → applications.id |
| beneficiary_id | INTEGER | FK → beneficiaries.id |
| program_id | INTEGER | FK → programs.id |
| assistance_type | TEXT | What was released |
| assistance_details | TEXT | Description / quantity |
| date_released | TEXT | Date |
| released_by | INTEGER | FK → users.id (releasing officer) |
| claim_code_used | TEXT | The claim code that was entered |

### `activity_log`
| Column | Type | Description |
|---|---|---|
| id | INTEGER PK | Auto-increment |
| user_id | INTEGER | FK → users.id |
| action | TEXT | e.g. `APPROVED`, `DELETED`, `RELEASED` |
| module | TEXT | e.g. `applications`, `beneficiaries` |
| description | TEXT | Human-readable log message |
| created_at | TEXT | Timestamp |

---

## 🎯 Innovative Features

### 1. ⚡ Live Duplicate Detector
As you type a beneficiary's full name, the system checks the database in real-time. If a similar record exists, a warning banner appears before you save — preventing duplicate registrations.

### 2. 🎫 Digital Claim Slip + Release Terminal
When an application is approved, a unique claim code is generated (e.g. `BA-20240624-X9K2`). The beneficiary shows this code at the distribution point. Staff enters the code into the Release Terminal, which validates and marks it as released — preventing double-claiming.

### 3. 📋 Audit Trail / Activity Log
Every important action (approve, reject, release, delete) is logged with the user, timestamp, and description. Admins can view the full log for accountability and transparency.

### 4. 📊 Program Utilization Tracker
Each program card shows a visual progress bar: how many slots are filled vs. available. Color changes from green → yellow → red as the program fills up.

---

## 🔐 Role-Based Access Control

| Feature | Admin | Staff |
|---|---|---|
| Login / Logout | ✅ | ✅ |
| View Dashboard | ✅ | ✅ |
| View Beneficiaries | ✅ | ✅ |
| Add / Edit Beneficiaries | ✅ | ✅ |
| Delete Beneficiaries | ✅ | ❌ |
| View / Manage Programs | ✅ | ✅ |
| Delete Programs | ✅ | ❌ |
| View / Manage Applications | ✅ | ✅ |
| Approve / Reject Applications | ✅ | ❌ |
| Release Distribution | ✅ | ✅ |
| View Reports | ✅ | ✅ |
| View Audit Log | ✅ | ❌ |
| Manage Users | ✅ | ❌ |

---

## 🖥️ Screen Breakdown

### 1. Login Screen
- Centered card with BantayAyuda logo + tagline
- Username and password fields
- Login button
- Error message on wrong credentials

### 2. Dashboard
- 5 stat cards: Total Beneficiaries, Total Programs, Total Applications, Approved, Released
- Program Utilization bars (top 3 active programs)
- Recent Activity Feed (last 5 actions from audit log)

### 3. Beneficiaries
- Search bar (by name, address, code)
- Filter by assistance category
- Table: Code | Name | Address | Contact | Category | Status | Actions
- Add/Edit modal form with live duplicate checker
- Delete (admin only)

### 4. Programs
- Filter by category and status
- Program cards: Name | Category | Slots used bar | Status | Actions
- Add/Edit modal form
- Delete (admin only)

### 5. Applications
- Filter by status (Pending / Approved / Rejected / Released)
- Filter by program
- Table: Code | Beneficiary | Program | Status | Date | Actions
- Add application modal
- View/Change status dropdown
- "View Claim Slip" button on Approved applications

### 6. Distribution / Release Terminal
- Big input box: "Enter Claim Code"
- Validate button → shows beneficiary + program details for confirmation
- Confirm Release button → logs to distributions table
- Recent Releases table below

### 7. Reports
- Dropdown: Select report type (Beneficiary Records / Application Summary / Program Utilization)
- Optional date range filter
- Printable table
- Print button

### 8. Audit Log (Admin only)
- Table: Date/Time | User | Action | Module | Description
- Filter by user or module

---

## 📝 Default Accounts

| Role | Username | Password |
|---|---|---|
| Administrator | `admin` | `admin123` |
| Staff | `staff` | `staff123` |

---

## 🏗️ Architecture Overview

```
Browser (Vanilla JS SPA)
        │
        │  HTTP (fetch API)
        ▼
Express.js Server (server.js)
        │
        ├── middleware/auth.js  ← Session validation on every protected route
        │
        ├── routes/*.routes.js  ← Business logic per module
        │
        └── database/db.js  ← Turso libSQL client
                │
                ▼
        Turso Cloud Database (SQLite)
```

---

*Built with ❤️ for the community — BantayAyuda 2024*
