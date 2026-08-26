import { pool } from '../config/db';

export class OnboardingService {
  static async getOnboardingTasks(role: string, employeeId: string, targetEmployeeId?: string) {
    let sql = `
      SELECT ot.*, e.name as employee_name, e.email as employee_email
      FROM onboarding_tasks ot
      JOIN employees e ON ot.employee_id = e.id
    `;
    const params: any[] = [];

    if (role !== 'Admin') {
      sql += ' WHERE ot.employee_id = ?';
      params.push(employeeId);
    } else if (targetEmployeeId) {
      sql += ' WHERE ot.employee_id = ?';
      params.push(targetEmployeeId);
    }

    sql += ' ORDER BY ot.created_at ASC, ot.due_date ASC';

    const [rows] = await pool.execute(sql, params);
    return rows;
  }

  static async toggleTaskCompletion(role: string, employeeId: string, taskId: string) {
    // 1. Get the task details
    const [rows]: any = await pool.execute(
      'SELECT id, employee_id, completed FROM onboarding_tasks WHERE id = ?',
      [taskId]
    );

    if (!rows || rows.length === 0) {
      throw { status: 404, message: 'Onboarding task not found.' };
    }

    const task = rows[0];

    // 2. Validate ownership
    if (role !== 'Admin' && task.employee_id !== employeeId) {
      throw { status: 403, message: 'Forbidden: You do not have permission to modify this task.' };
    }

    // 3. Toggle completed state
    const newCompleted = task.completed ? 0 : 1;
    const completedDate = newCompleted ? new Date().toISOString().split('T')[0] : null;

    await pool.execute(
      'UPDATE onboarding_tasks SET completed = ?, completed_date = ? WHERE id = ?',
      [newCompleted, completedDate, taskId]
    );

    return {
      taskId,
      completed: !!newCompleted,
      completed_date: completedDate
    };
  }
}
