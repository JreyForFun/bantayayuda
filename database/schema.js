// database/schema.js
// Run once: node database/schema.js
// Creates all tables and seeds default data
import db from './db.js';

async function initializeDatabase() {
  console.log('Initializing BantayAyuda database on Turso...');

  try {
    // 1. Users Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);
    console.log('✔ Users table checked/created.');

    // 2. Beneficiaries Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS beneficiaries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        beneficiary_code TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        address TEXT NOT NULL,
        contact_number TEXT NOT NULL,
        birthdate TEXT NOT NULL,
        assistance_category TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TEXT NOT NULL,
        created_by INTEGER,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);
    console.log('✔ Beneficiaries table checked/created.');

    // 3. Programs Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS programs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        program_code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        budget_slots INTEGER NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TEXT NOT NULL,
        created_by INTEGER,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);
    console.log('✔ Programs table checked/created.');

    // 4. Applications Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        application_code TEXT UNIQUE NOT NULL,
        beneficiary_id INTEGER NOT NULL,
        program_id INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        claim_code TEXT UNIQUE,
        notes TEXT,
        applied_at TEXT NOT NULL,
        reviewed_at TEXT,
        reviewed_by INTEGER,
        FOREIGN KEY (beneficiary_id) REFERENCES beneficiaries(id),
        FOREIGN KEY (program_id) REFERENCES programs(id),
        FOREIGN KEY (reviewed_by) REFERENCES users(id)
      )
    `);
    console.log('✔ Applications table checked/created.');

    // 5. Distributions Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS distributions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        application_id INTEGER NOT NULL,
        beneficiary_id INTEGER NOT NULL,
        program_id INTEGER NOT NULL,
        assistance_type TEXT NOT NULL,
        assistance_details TEXT NOT NULL,
        date_released TEXT NOT NULL,
        released_by INTEGER NOT NULL,
        claim_code_used TEXT NOT NULL,
        FOREIGN KEY (application_id) REFERENCES applications(id),
        FOREIGN KEY (beneficiary_id) REFERENCES beneficiaries(id),
        FOREIGN KEY (program_id) REFERENCES programs(id),
        FOREIGN KEY (released_by) REFERENCES users(id)
      )
    `);
    console.log('✔ Distributions table checked/created.');

    // 6. Activity / Audit Log Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS activity_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        module TEXT NOT NULL,
        description TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    console.log('✔ Activity log table checked/created.');

    // --- SEED DEFAULT USERS ---
    const userCheck = await db.execute("SELECT COUNT(*) as count FROM users");
    if (userCheck.rows[0].count === 0) {
      const now = new Date().toISOString();
      await db.execute({
        sql: "INSERT INTO users (username, password, full_name, role, created_at) VALUES (?, ?, ?, ?, ?)",
        args: ["admin", "admin123", "LGU Administrator", "admin", now]
      });
      await db.execute({
        sql: "INSERT INTO users (username, password, full_name, role, created_at) VALUES (?, ?, ?, ?, ?)",
        args: ["staff", "staff123", "Relief Officer Juan", "staff", now]
      });
      console.log('✔ Seeded Users: admin/admin123 and staff/staff123');
    }

    // --- SEED SAMPLE PROGRAMS ---
    const programCheck = await db.execute("SELECT COUNT(*) as count FROM programs");
    if (programCheck.rows[0].count === 0) {
      const now = new Date().toISOString();
      await db.execute({
        sql: `INSERT INTO programs (program_code, name, description, category, budget_slots, start_date, end_date, created_at, created_by) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: ["PROG-001", "Albay Scholarship Grant", "Financial assistance for college students in Albay.", "Scholarship", 100, "2026-06-01", "2026-12-31", now, 1]
      });
      await db.execute({
        sql: `INSERT INTO programs (program_code, name, description, category, budget_slots, start_date, end_date, created_at, created_by) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: ["PROG-002", "Brgy Relief Pack Distribution", "Relief pack containing rice, canned goods, and noodles.", "Relief", 500, "2026-06-15", "2026-07-15", now, 1]
      });
      await db.execute({
        sql: `INSERT INTO programs (program_code, name, description, category, budget_slots, start_date, end_date, created_at, created_by) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: ["PROG-003", "Senior Medical Cash Aid", "Financial assistance for medicine and hospital care for senior citizens.", "Medical", 50, "2026-06-20", "2026-08-20", now, 1]
      });
      console.log('✔ Seeded 3 sample programs.');
    }

    // --- SEED SAMPLE BENEFICIARIES ---
    const beneficiaryCheck = await db.execute("SELECT COUNT(*) as count FROM beneficiaries");
    if (beneficiaryCheck.rows[0].count === 0) {
      const now = new Date().toISOString();
      await db.execute({
        sql: `INSERT INTO beneficiaries (beneficiary_code, full_name, address, contact_number, birthdate, assistance_category, created_at, created_by) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: ["BEN-0001", "Juan Dela Cruz", "Brgy. Sta. Cruz, Legazpi City", "09171234567", "1995-08-15", "Relief", now, 1]
      });
      await db.execute({
        sql: `INSERT INTO beneficiaries (beneficiary_code, full_name, address, contact_number, birthdate, assistance_category, created_at, created_by) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: ["BEN-0002", "Maria Santos", "Brgy. Oro Site, Legazpi City", "09187654321", "2002-12-05", "Scholarship", now, 1]
      });
      await db.execute({
        sql: `INSERT INTO beneficiaries (beneficiary_code, full_name, address, contact_number, birthdate, assistance_category, created_at, created_by) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: ["BEN-0003", "Jose Rizal", "Brgy. Bagumbayan, Legazpi City", "09199998888", "1960-06-19", "Medical", now, 1]
      });
      console.log('✔ Seeded 3 sample beneficiaries.');
    }

    console.log('Database initialization completed successfully! 🎉');
  } catch (error) {
    console.error('❌ Database Initialization failed:', error);
  }
}

initializeDatabase();
