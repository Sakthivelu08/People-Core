import { pool } from '../config/db';
import { v4 as uuidv4 } from 'uuid';
import { getCache, setCache, invalidateCache } from '../config/redis';

export interface RegisterEmployeeDto {
  azure_oid: string;
  name: string;
  email: string;
  job_title?: string;
  department?: string;
  office_location?: string;
  mobile_phone?: string;
  role?: 'Admin' | 'Employee';
  status?: 'active' | 'onboarding' | 'inactive';
  join_date?: string;
}

export class EmployeeService {
  static async getProfileById(id: string) {
    const [rows]: any = await pool.execute(
      `SELECT id, azure_oid, name, email, job_title, department, office_location, mobile_phone, role, status, join_date, created_at
       FROM employees WHERE id = ?`,
      [id]
    );

    if (!rows || rows.length === 0) {
      return null;
    }
    return rows[0];
  }

  static async getAllEmployees() {
    const cacheKey = 'employees:all';
    const cached = await getCache(cacheKey);
    if (cached) {
      return cached;
    }

    const [rows]: any = await pool.execute(
      `SELECT id, azure_oid, name, email, job_title, department, office_location, mobile_phone, role, status, join_date, created_at
       FROM employees ORDER BY name ASC`
    );

    await setCache(cacheKey, rows, 300); // Cache for 5 minutes
    return rows;
  }

  static async registerEmployee(dto: RegisterEmployeeDto) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const employeeId = uuidv4();
      const cleanOid = dto.azure_oid === 'generate' ? uuidv4() : dto.azure_oid;

      // 1. Insert employee record
      await connection.execute(
        `INSERT INTO employees (id, azure_oid, name, email, job_title, department, office_location, mobile_phone, role, status, join_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          employeeId,
          cleanOid,
          dto.name,
          dto.email,
          dto.job_title || null,
          dto.department || null,
          dto.office_location || null,
          dto.mobile_phone || null,
          dto.role || 'Employee',
          dto.status || 'onboarding',
          dto.join_date || null
        ]
      );

      // 2. Initialize leave balance
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
      await invalidateCache('employees:all');

      return employeeId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}
