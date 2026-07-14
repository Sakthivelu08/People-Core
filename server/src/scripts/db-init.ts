import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const host = process.env.DB_HOST || '127.0.0.1';
const port = parseInt(process.env.DB_PORT || '3306', 10);
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const database = process.env.DB_NAME || 'peoplecore';

async function main() {
  console.log('[DB-Init] Connecting to MySQL server to check/initialize database...');
  
  // 1. Connect without database to create it if it doesn't exist
  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password
  });

  console.log(`[DB-Init] Creating database "${database}" if it does not exist...`);
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
  await connection.end();

  // 2. Connect directly to the database to create tables and seed data
  const dbConnection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database
  });

  console.log('[DB-Init] Creating tables...');

  // Create employees table
  await dbConnection.query(`
    CREATE TABLE IF NOT EXISTS employees (
      id              CHAR(36)        PRIMARY KEY DEFAULT (UUID()),
      azure_oid       VARCHAR(100)    UNIQUE NOT NULL,
      name            VARCHAR(200)    NOT NULL,
      email           VARCHAR(200)    NOT NULL UNIQUE,
      job_title       VARCHAR(200),
      department      VARCHAR(200),
      office_location VARCHAR(200),
      mobile_phone    VARCHAR(50),
      role            ENUM('Admin','Employee') DEFAULT 'Employee',
      status          ENUM('active','onboarding','inactive') DEFAULT 'active',
      join_date       DATE,
      created_at      DATETIME        DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create leave_requests table
  await dbConnection.query(`
    CREATE TABLE IF NOT EXISTS leave_requests (
      id              CHAR(36)        PRIMARY KEY DEFAULT (UUID()),
      employee_id     CHAR(36)        NOT NULL,
      type            ENUM('annual','sick','casual') NOT NULL,
      start_date      DATE            NOT NULL,
      end_date        DATE            NOT NULL,
      days            INT             NOT NULL,
      reason          VARCHAR(500),
      status          ENUM('pending','approved','rejected') DEFAULT 'pending',
      applied_on      DATE            DEFAULT (CURRENT_DATE),
      reviewed_by     CHAR(36),
      reviewed_on     DATE,
      FOREIGN KEY (employee_id) REFERENCES employees(id),
      FOREIGN KEY (reviewed_by) REFERENCES employees(id)
    );
  `);

  // Create leave_balances table
  await dbConnection.query(`
    CREATE TABLE IF NOT EXISTS leave_balances (
      id              CHAR(36)        PRIMARY KEY DEFAULT (UUID()),
      employee_id     CHAR(36)        NOT NULL UNIQUE,
      annual_total    INT             DEFAULT 14,
      sick_total      INT             DEFAULT 12,
      casual_total    INT             DEFAULT 6,
      year            YEAR            DEFAULT (YEAR(CURRENT_DATE)),
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    );
  `);

  // Create onboarding_tasks table
  await dbConnection.query(`
    CREATE TABLE IF NOT EXISTS onboarding_tasks (
      id              CHAR(36)        PRIMARY KEY DEFAULT (UUID()),
      employee_id     CHAR(36)        NOT NULL,
      title           VARCHAR(200)    NOT NULL,
      description     VARCHAR(500),
      category        ENUM('documents','training','setup','orientation') NOT NULL,
      completed       TINYINT(1)      DEFAULT 0,
      due_date        DATE,
      completed_date  DATE,
      created_at      DATETIME        DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    );
  `);

  // Create attrition_scores table
  await dbConnection.query(`
    CREATE TABLE IF NOT EXISTS attrition_scores (
      id              CHAR(36)        PRIMARY KEY DEFAULT (UUID()),
      employee_id     CHAR(36)        NOT NULL,
      risk_score      DECIMAL(5,2),
      risk_level      ENUM('low','medium','high'),
      key_factors     TEXT,
      generated_at    DATETIME        DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    );
  `);

  // Create engagement_scores table
  await dbConnection.query(`
    CREATE TABLE IF NOT EXISTS engagement_scores (
      id              CHAR(36)        PRIMARY KEY DEFAULT (UUID()),
      department      VARCHAR(200)    NOT NULL,
      score           DECIMAL(5,2),
      trend           ENUM('rising','stable','declining'),
      recorded_at     DATETIME        DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('[DB-Init] Seeding initial data if tables are empty...');

  // Check if we already have employees
  const [employees]: any = await dbConnection.query('SELECT COUNT(*) as count FROM employees');
  if (employees[0].count === 0) {
    console.log('[DB-Init] Seeding employees...');
    await dbConnection.query(`
      INSERT INTO employees (id, azure_oid, name, email, job_title, department, role, status, join_date) VALUES
        ('a5d0a53b-8704-4866-aa37-0ea2a9f93238', 'a5d0a53b-8704-4866-aa37-0ea2a9f93238', 'Sakthivelu Selvam', 'sakthivelu.selvam@3dg82f.onmicrosoft.com', 'Senior Developer', 'Engineering', 'Admin', 'active', '2022-06-01'),
        (UUID(), UUID(),                                  'Priya Rajan',       'priya.rajan@psiog.com',                      'HR Manager',       'HR',          'Admin', 'active', '2021-03-15'),
        (UUID(), UUID(),                                  'Arjun Mehta',       'arjun.mehta@psiog.com',                      'Sales Executive',  'Sales',       'Employee', 'onboarding', '2026-06-01'),
        (UUID(), UUID(),                                  'Divya Nair',        'divya.nair@psiog.com',                       'Support Lead',     'Support',     'Employee', 'active', '2023-01-10');
    `);

    console.log('[DB-Init] Seeding leave balances...');
    await dbConnection.query(`
      INSERT INTO leave_balances (id, employee_id, annual_total, sick_total, casual_total)
      SELECT UUID(), id, 14, 12, 6 FROM employees;
    `);

    console.log('[DB-Init] Seeding leave requests...');
    // Seed Sakthivelu leave requests
    await dbConnection.query(`
      INSERT INTO leave_requests (id, employee_id, type, start_date, end_date, days, reason, status, applied_on)
      SELECT UUID(), id, 'annual', '2026-05-12', '2026-05-14', 3, 'Family vacation', 'approved', '2026-05-01'
      FROM employees WHERE email = 'sakthivelu.selvam@3dg82f.onmicrosoft.com';
    `);
    await dbConnection.query(`
      INSERT INTO leave_requests (id, employee_id, type, start_date, end_date, days, reason, status, applied_on)
      SELECT UUID(), id, 'sick', '2026-06-02', '2026-06-02', 1, 'Fever and cold', 'approved', '2026-06-02'
      FROM employees WHERE email = 'sakthivelu.selvam@3dg82f.onmicrosoft.com';
    `);
    await dbConnection.query(`
      INSERT INTO leave_requests (id, employee_id, type, start_date, end_date, days, reason, status, applied_on)
      SELECT UUID(), id, 'casual', '2026-06-20', '2026-06-20', 1, 'Personal errand', 'pending', '2026-06-10'
      FROM employees WHERE email = 'sakthivelu.selvam@3dg82f.onmicrosoft.com';
    `);

    console.log('[DB-Init] Seeding onboarding tasks...');
    await dbConnection.query(`
      INSERT INTO onboarding_tasks (id, employee_id, title, description, category, completed, due_date)
      SELECT UUID(), id, 'Submit ID proof',        'Upload Aadhaar or Passport copy',          'documents',   1, '2026-06-05' FROM employees WHERE email = 'arjun.mehta@psiog.com' UNION ALL
      SELECT UUID(), id, 'Sign offer letter',      'Digitally sign and return',                'documents',   1, '2026-06-05' FROM employees WHERE email = 'arjun.mehta@psiog.com' UNION ALL
      SELECT UUID(), id, 'Complete HR induction',  'Attend the 2-hour HR orientation session', 'orientation', 1, '2026-06-07' FROM employees WHERE email = 'arjun.mehta@psiog.com' UNION ALL
      SELECT UUID(), id, 'Set up laptop & email',  'Configure work email and install tools',   'setup',       1, '2026-06-08' FROM employees WHERE email = 'arjun.mehta@psiog.com' UNION ALL
      SELECT UUID(), id, 'Complete security training', 'Finish mandatory cybersecurity course','training',    0, '2026-06-20' FROM employees WHERE email = 'arjun.mehta@psiog.com' UNION ALL
      SELECT UUID(), id, 'Meet your team',         'Introductory 1:1 with each team member',  'orientation', 0, '2026-06-15' FROM employees WHERE email = 'arjun.mehta@psiog.com' UNION ALL
      SELECT UUID(), id, 'Complete Angular basics','Finish the internal Angular training module','training',   0, '2026-06-25' FROM employees WHERE email = 'arjun.mehta@psiog.com' UNION ALL
      SELECT UUID(), id, 'Set up DevOps access',   'Request and verify access to project boards','setup',     0, '2026-06-18' FROM employees WHERE email = 'arjun.mehta@psiog.com';
    `);

    console.log('[DB-Init] Seeding attrition scores...');
    await dbConnection.query(`
      INSERT INTO attrition_scores (id, employee_id, risk_score, risk_level, key_factors)
      SELECT UUID(), id, 18.0,  'low',    'Strong performance,Active on projects'          FROM employees WHERE email = 'sakthivelu.selvam@3dg82f.onmicrosoft.com' UNION ALL
      SELECT UUID(), id, 12.0,  'low',    'High engagement,Recent recognition'             FROM employees WHERE email = 'priya.rajan@psiog.com' UNION ALL
      SELECT UUID(), id, 78.0,  'high',   'Short tenure,Low performance score,Missed check-ins' FROM employees WHERE email = 'arjun.mehta@psiog.com' UNION ALL
      SELECT UUID(), id, 54.0,  'medium', 'No promotion in 2 years,Declining engagement'  FROM employees WHERE email = 'divya.nair@psiog.com';
    `);

    console.log('[DB-Init] Seeding engagement scores...');
    await dbConnection.query(`
      INSERT INTO engagement_scores (id, department, score, trend) VALUES
        (UUID(), 'Engineering', 84.0, 'rising'),
        (UUID(), 'HR',          91.0, 'stable'),
        (UUID(), 'Sales',       62.0, 'declining'),
        (UUID(), 'Support',     70.0, 'stable');
    `);

    console.log('[DB-Init] Seed completed.');
  } else {
    console.log('[DB-Init] Tables already have data. Skipping seeding.');
  }

  await dbConnection.end();
  console.log('[DB-Init] Initialization finished successfully!');
}

main().catch((err) => {
  console.error('[DB-Init] Initialization failed:', err);
  process.exit(1);
});
