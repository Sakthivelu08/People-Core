import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../config/db';
import { authenticate } from '../middlewares/auth';

const router = Router();

// GET /api/onboarding/tasks - Get onboarding tasks
// Admins can see all or filter by employee_id; employees see only their own
router.get('/tasks', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const targetEmployeeId = req.query.employee_id || req.query.employeeId;

    let sql = `
      SELECT ot.*, e.name as employee_name, e.email as employee_email
      FROM onboarding_tasks ot
      JOIN employees e ON ot.employee_id = e.id
    `;
    const params: any[] = [];

    if (req.user?.role !== 'Admin') {
      // Employees can only view their own onboarding tasks
      sql += ' WHERE ot.employee_id = ?';
      params.push(req.user!.id);
    } else if (targetEmployeeId) {
      // Admins can filter by employee_id
      sql += ' WHERE ot.employee_id = ?';
      params.push(targetEmployeeId);
    }

    sql += ' ORDER BY ot.created_at ASC, ot.due_date ASC';

    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/onboarding/tasks/:id/toggle - Toggle task completion status
router.patch('/tasks/:id/toggle', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const taskId = req.params.id;

    // 1. Get the task details
    const [rows]: any = await pool.execute(
      'SELECT id, employee_id, completed FROM onboarding_tasks WHERE id = ?',
      [taskId]
    );

    if (!rows || rows.length === 0) {
      res.status(404).json({ error: 'Onboarding task not found.' });
      return;
    }

    const task = rows[0];

    // 2. Validate ownership (Admins can toggle anyone's tasks; Employees only their own)
    if (req.user?.role !== 'Admin' && task.employee_id !== req.user!.id) {
      res.status(403).json({ error: 'Forbidden: You do not have permission to modify this task.' });
      return;
    }

    // 3. Toggle completed state and set completion date
    const newCompleted = task.completed ? 0 : 1;
    const completedDate = newCompleted ? new Date().toISOString().split('T')[0] : null;

    await pool.execute(
      'UPDATE onboarding_tasks SET completed = ?, completed_date = ? WHERE id = ?',
      [newCompleted, completedDate, taskId]
    );

    res.json({
      message: 'Onboarding task updated successfully.',
      taskId,
      completed: !!newCompleted,
      completed_date: completedDate
    });
  } catch (error) {
    next(error);
  }
});

export default router;
