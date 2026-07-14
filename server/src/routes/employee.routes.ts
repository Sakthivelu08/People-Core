import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../config/db';
import { authenticate, authorizeAdmin } from '../middlewares/auth';

const router = Router();

// GET /api/employees/me - Get currently logged-in user profile
router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [rows]: any = await pool.execute(
      `SELECT id, azure_oid, name, email, job_title, department, office_location, mobile_phone, role, status, join_date, created_at
       FROM employees WHERE id = ?`,
      [req.user!.id]
    );

    if (!rows || rows.length === 0) {
      res.status(404).json({ error: 'Employee profile not found.' });
      return;
    }

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

// GET /api/employees - List all employees (Admin only)
router.get('/', authenticate, authorizeAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [rows]: any = await pool.execute(
      `SELECT id, azure_oid, name, email, job_title, department, office_location, mobile_phone, role, status, join_date, created_at
       FROM employees ORDER BY name ASC`
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

// POST /api/employees - Register a new employee (Admin only)
router.post('/', authenticate, authorizeAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const connection = await pool.getConnection();
  try {
    const {
      azure_oid,
      name,
      email,
      job_title,
      department,
      office_location,
      mobile_phone,
      role = 'Employee',
      status = 'onboarding',
      join_date
    } = req.body;

    // Simple validation
    if (!azure_oid || !name || !email) {
      res.status(400).json({ error: 'Missing required fields: azure_oid, name, and email are mandatory.' });
      return;
    }

    await connection.beginTransaction();

    const employeeId = uuidv4();

    // 1. Insert employee record
    await connection.execute(
      `INSERT INTO employees (id, azure_oid, name, email, job_title, department, office_location, mobile_phone, role, status, join_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        employeeId,
        azureOidClean(azure_oid),
        name,
        email,
        job_title || null,
        department || null,
        office_location || null,
        mobile_phone || null,
        role,
        status,
        join_date || null
      ]
    );

    // 2. Initialize leave balance (default annual=14, sick=12, casual=6)
    await connection.execute(
      `INSERT INTO leave_balances (id, employee_id, annual_total, sick_total, casual_total)
       VALUES (UUID(), ?, 14, 12, 6)`,
      [employeeId]
    );

    // 3. Seed default onboarding tasks
    const onboardingTasks = [
      { title: 'Submit ID proof', description: 'Upload Aadhaar or Passport copy', category: 'documents', dueOffset: 5 },
      { title: 'Sign offer letter', description: 'Digitally sign and return', category: 'documents', dueOffset: 5 },
      { title: 'Complete HR induction', description: 'Attend the 2-hour HR orientation session', category: 'orientation', dueOffset: 7 },
      { title: 'Set up laptop & email', description: 'Configure work email and install tools', category: 'setup', dueOffset: 8 },
      { title: 'Complete security training', description: 'Finish mandatory cybersecurity course', category: 'training', dueOffset: 20 },
      { title: 'Meet your team', description: 'Introductory 1:1 with each team member', category: 'orientation', dueOffset: 15 },
      { title: 'Complete Angular basics', description: 'Finish the internal Angular training module', category: 'training', dueOffset: 25 },
      { title: 'Set up DevOps access', description: 'Request and verify access to project boards', category: 'setup', dueOffset: 18 }
    ];

    const today = new Date();
    for (const task of onboardingTasks) {
      const dueDate = new Date();
      dueDate.setDate(today.getDate() + task.dueOffset);
      const dueDateStr = dueDate.toISOString().split('T')[0];

      await connection.execute(
        `INSERT INTO onboarding_tasks (id, employee_id, title, description, category, completed, due_date)
         VALUES (UUID(), ?, ?, ?, ?, 0, ?)`,
        [employeeId, task.title, task.description, task.category, dueDateStr]
      );
    }

    await connection.commit();
    res.status(201).json({
      message: 'Employee registered successfully, default leave balance and onboarding tasks initialized.',
      employeeId
    });
  } catch (error: any) {
    await connection.rollback();
    // Check for duplicate key error
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'Conflict: An employee with this email or Azure OID already exists.' });
    } else {
      next(error);
    }
  } finally {
    connection.release();
  }
});

function azureOidClean(val: string): string {
  // If user passes 'generate', we auto-generate a UUID for Azure OID
  return val === 'generate' ? uuidv4() : val;
}

export default router;
