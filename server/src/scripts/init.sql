-- MySQL Database Initialization Script for PeopleCore

-- Ensure database exists
CREATE DATABASE IF NOT EXISTS `peoplecore`;
USE `peoplecore`;

-- 1. Create employees table
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

-- 2. Create leave_requests table
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

-- 3. Create leave_balances table
CREATE TABLE IF NOT EXISTS leave_balances (
  id              CHAR(36)        PRIMARY KEY DEFAULT (UUID()),
  employee_id     CHAR(36)        NOT NULL UNIQUE,
  annual_total    INT             DEFAULT 14,
  sick_total      INT             DEFAULT 12,
  casual_total    INT             DEFAULT 6,
  year            YEAR            DEFAULT (YEAR(CURRENT_DATE)),
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- 4. Create onboarding_tasks table
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

-- 5. Create attrition_scores table
CREATE TABLE IF NOT EXISTS attrition_scores (
  id              CHAR(36)        PRIMARY KEY DEFAULT (UUID()),
  employee_id     CHAR(36)        NOT NULL,
  risk_score      DECIMAL(5,2),
  risk_level      ENUM('low','medium','high'),
  key_factors     TEXT,
  generated_at    DATETIME        DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- 6. Create engagement_scores table
CREATE TABLE IF NOT EXISTS engagement_scores (
  id              CHAR(36)        PRIMARY KEY DEFAULT (UUID()),
  department      VARCHAR(200)    NOT NULL,
  score           DECIMAL(5,2),
  trend           ENUM('rising','stable','declining'),
  recorded_at     DATETIME        DEFAULT CURRENT_TIMESTAMP
);

-- 7. Create narrative_insights table
CREATE TABLE IF NOT EXISTS narrative_insights (
  id              CHAR(36)        PRIMARY KEY DEFAULT (UUID()),
  narrative       TEXT            NOT NULL,
  generated_at    DATETIME        DEFAULT CURRENT_TIMESTAMP
);

-- 8. Seed default data if tables are empty
-- Define temporary seed variables/checks
-- We use a stored procedure to safely check table count before seeding
DELIMITER //

CREATE PROCEDURE SeedDefaultData()
BEGIN
  DECLARE emp_count INT;
  SELECT COUNT(*) INTO emp_count FROM employees;
  
  IF emp_count = 0 THEN
    -- Seed initial employees
    -- The first UUID maps to DEFAULT_AZURE_OID from server config:
    -- 'b2f567ca-991f-4bb0-80a4-cb22a4875a6c' or a fallback UUID
    -- We use standard static UUIDs here to map relationships cleanly:
    SET @emp1_id = '018b14e5-9f5b-7b00-88cb-e389e6e88e22';
    SET @emp2_id = '018b14e5-9f5b-7b00-88cb-e389e6e88e23';
    SET @emp3_id = '018b14e5-9f5b-7b00-88cb-e389e6e88e24';
    SET @emp4_id = '018b14e5-9f5b-7b00-88cb-e389e6e88e25';

    INSERT INTO employees (id, azure_oid, name, email, job_title, department, role, status, join_date) VALUES
      (@emp1_id, 'a5d0a53b-8704-4866-aa37-0ea2a9f93238', 'Sakthivelu Selvam', 'sakthivelu.selvam@3dg82f.onmicrosoft.com', 'Senior Developer', 'Engineering', 'Admin', 'active', '2022-06-01'),
      (@emp2_id, UUID(),                                  'Priya Rajan',       'priya.rajan@psiog.com',                      'HR Manager',       'HR',          'Admin', 'active', '2021-03-15'),
      (@emp3_id, UUID(),                                  'Arjun Mehta',       'arjun.mehta@psiog.com',                      'Sales Executive',  'Sales',       'Employee', 'onboarding', '2026-06-01'),
      (@emp4_id, UUID(),                                  'Divya Nair',        'divya.nair@psiog.com',                       'Support Lead',     'Support',     'Employee', 'active', '2023-01-10');

    -- Seed leave balances
    INSERT INTO leave_balances (id, employee_id, annual_total, sick_total, casual_total) VALUES
      (UUID(), @emp1_id, 14, 12, 6),
      (UUID(), @emp2_id, 14, 12, 6),
      (UUID(), @emp3_id, 14, 12, 6),
      (UUID(), @emp4_id, 14, 12, 6);

    -- Seed leave requests
    INSERT INTO leave_requests (id, employee_id, type, start_date, end_date, days, reason, status, applied_on) VALUES
      (UUID(), @emp1_id, 'annual', '2026-05-12', '2026-05-14', 3, 'Family vacation', 'approved', '2026-05-01'),
      (UUID(), @emp1_id, 'sick', '2026-06-02', '2026-06-02', 1, 'Fever and cold', 'approved', '2026-06-02'),
      (UUID(), @emp1_id, 'casual', '2026-06-20', '2026-06-20', 1, 'Personal errand', 'pending', '2026-06-10');

    -- Seed onboarding tasks for Arjun Mehta
    INSERT INTO onboarding_tasks (id, employee_id, title, description, category, completed, due_date) VALUES
      (UUID(), @emp3_id, 'Submit ID proof',        'Upload Aadhaar or Passport copy',          'documents',   1, '2026-06-05'),
      (UUID(), @emp3_id, 'Sign offer letter',      'Digitally sign and return',                'documents',   1, '2026-06-05'),
      (UUID(), @emp3_id, 'Complete HR induction',  'Attend the 2-hour HR orientation session', 'orientation', 1, '2026-06-07'),
      (UUID(), @emp3_id, 'Set up laptop & email',  'Configure work email and install tools',   'setup',       1, '2026-06-08'),
      (UUID(), @emp3_id, 'Complete security training', 'Finish mandatory cybersecurity course','training',    0, '2026-06-20'),
      (UUID(), @emp3_id, 'Meet your team',         'Introductory 1:1 with each team member',  'orientation', 0, '2026-06-15'),
      (UUID(), @emp3_id, 'Complete Angular basics','Finish the internal Angular training module','training',   0, '2026-06-25'),
      (UUID(), @emp3_id, 'Set up DevOps access',   'Request and verify access to project boards','setup',     0, '2026-06-18');

    -- Seed attrition scores
    INSERT INTO attrition_scores (id, employee_id, risk_score, risk_level, key_factors) VALUES
      (UUID(), @emp1_id, 18.0,  'low',    'Strong performance,Active on projects'),
      (UUID(), @emp2_id, 12.0,  'low',    'High engagement,Recent recognition'),
      (UUID(), @emp3_id, 78.0,  'high',   'Short tenure,Low performance score,Missed check-ins'),
      (UUID(), @emp4_id, 54.0,  'medium', 'No promotion in 2 years,Declining engagement');

    -- Seed engagement scores
    INSERT INTO engagement_scores (id, department, score, trend) VALUES
      (UUID(), 'Engineering', 84.0, 'rising'),
      (UUID(), 'HR',          91.0, 'stable'),
      (UUID(), 'Sales',       62.0, 'declining'),
      (UUID(), 'Support',     70.0, 'stable');
  END IF;
END //

DELIMITER ;

-- Call seed procedure
CALL SeedDefaultData();

-- Drop seed procedure so DB schema remains pristine
DROP PROCEDURE SeedDefaultData;
