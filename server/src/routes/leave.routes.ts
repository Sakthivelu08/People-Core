import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../config/db';
import { authenticate, authorizeAdmin } from '../middlewares/auth';

const router = Router();

// Helper to get leave summary (allocated, used, remaining) for an employee
async function getEmployeeLeaveBalance(employeeId: string, year: number = new Date().getFullYear()) {
  // 1. Get initial totals from leave_balances
  const [balanceRows]: any = await pool.execute(
    'SELECT annual_total, sick_total, casual_total FROM leave_balances WHERE employee_id = ? AND year = ?',
    [employeeId, year]
  );

  const allocated = balanceRows[0] || { annual_total: 14, sick_total: 12, casual_total: 6 };

  // 2. Get approved leave days grouped by type
  const [usedRows]: any = await pool.execute(
    `SELECT type, SUM(days) as total_days
     FROM leave_requests
     WHERE employee_id = ? AND status = 'approved' AND YEAR(start_date) = ?
     GROUP BY type`,
    [employeeId, year]
  );

  const used = { annual: 0, sick: 0, casual: 0 };
  usedRows.forEach((row: any) => {
    if (row.type in used) {
      used[row.type as keyof typeof used] = parseInt(row.total_days, 10);
    }
  });

  const summary = {
    allocated: {
      annual: allocated.annual_total,
      sick: allocated.sick_total,
      casual: allocated.casual_total
    },
    used,
    remaining: {
      annual: Math.max(0, allocated.annual_total - used.annual),
      sick: Math.max(0, allocated.sick_total - used.sick),
      casual: Math.max(0, allocated.casual_total - used.casual)
    }
  };

  return summary;
}

// GET /api/leaves/balances - Get leave balances for the logged-in employee
router.get('/balances', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const summary = await getEmployeeLeaveBalance(req.user!.id);
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

// GET /api/leaves/requests - List leave requests
// Admins see all, employees see only their own
router.get('/requests', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let sql = `
      SELECT lr.*, e.name as employee_name, e.email as employee_email, r.name as reviewer_name
      FROM leave_requests lr
      JOIN employees e ON lr.employee_id = e.id
      LEFT JOIN employees r ON lr.reviewed_by = r.id
    `;
    const params: any[] = [];

    if (req.user?.role !== 'Admin') {
      sql += ' WHERE lr.employee_id = ?';
      params.push(req.user!.id);
    }

    sql += ' ORDER BY lr.applied_on DESC, lr.start_date DESC';

    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

// POST /api/leaves/requests - Submit a new leave request
router.post('/requests', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { type, start_date, end_date, days, reason } = req.body;

    // Validation
    if (!type || !start_date || !end_date || !days) {
      res.status(400).json({ error: 'Missing required fields: type, start_date, end_date, and days are mandatory.' });
      return;
    }

    const leaveType = type.toLowerCase();
    if (!['annual', 'sick', 'casual'].includes(leaveType)) {
      res.status(400).json({ error: 'Invalid leave type. Must be annual, sick, or casual.' });
      return;
    }

    const start = new Date(start_date);
    const end = new Date(end_date);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      res.status(400).json({ error: 'Invalid dates. start_date must be before or equal to end_date.' });
      return;
    }

    const requestedDays = parseInt(days, 10);
    if (requestedDays <= 0) {
      res.status(400).json({ error: 'Days must be greater than zero.' });
      return;
    }

    // 1. Check leave balance
    const balance = await getEmployeeLeaveBalance(req.user!.id, start.getFullYear());
    const remaining = balance.remaining[leaveType as keyof typeof balance.remaining];

    if (requestedDays > remaining) {
      res.status(400).json({
        error: `Insufficient leave balance. You requested ${requestedDays} days of ${leaveType} leave, but only have ${remaining} days remaining.`
      });
      return;
    }

    // 2. Check for overlapping requests
    const [overlapRows]: any = await pool.execute(
      `SELECT COUNT(*) as count FROM leave_requests
       WHERE employee_id = ? AND status IN ('pending', 'approved')
         AND NOT (end_date < ? OR start_date > ?)`,
      [req.user!.id, start_date, end_date]
    );

    if (overlapRows[0].count > 0) {
      res.status(400).json({ error: 'Overlap detected: You already have a pending or approved leave request during these dates.' });
      return;
    }

    // 3. Insert new request
    const requestId = uuidv4();
    const todayStr = new Date().toISOString().split('T')[0];

    await pool.execute(
      `INSERT INTO leave_requests (id, employee_id, type, start_date, end_date, days, reason, status, applied_on)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [requestId, req.user!.id, leaveType, start_date, end_date, requestedDays, reason || null, todayStr]
    );

    res.status(201).json({
      message: 'Leave request submitted successfully.',
      requestId
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/leaves/requests/:id/status - Approve or reject a request (Admin only)
router.patch('/requests/:id/status', authenticate, authorizeAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const requestId = req.params.id;
    const { status } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      res.status(400).json({ error: 'Invalid status. Status must be approved or rejected.' });
      return;
    }

    // Get the request
    const [requests]: any = await pool.execute(
      'SELECT employee_id, status, type, days, start_date FROM leave_requests WHERE id = ?',
      [requestId]
    );

    if (!requests || requests.length === 0) {
      res.status(404).json({ error: 'Leave request not found.' });
      return;
    }

    const request = requests[0];
    if (request.status !== 'pending') {
      res.status(400).json({ error: `Cannot update status. The request has already been ${request.status}.` });
      return;
    }

    // If approving, re-check remaining balance to avoid race conditions
    if (status === 'approved') {
      const year = new Date(request.start_date).getFullYear();
      const balance = await getEmployeeLeaveBalance(request.employee_id, year);
      const remaining = balance.remaining[request.type as keyof typeof balance.remaining];

      if (request.days > remaining) {
        res.status(400).json({
          error: `Cannot approve. The employee has insufficient leave balance (${remaining} days remaining, requested ${request.days} days).`
        });
        return;
      }
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Update status
    await pool.execute(
      `UPDATE leave_requests
       SET status = ?, reviewed_by = ?, reviewed_on = ?
       WHERE id = ?`,
      [status, req.user!.id, todayStr, requestId]
    );

    res.json({
      message: `Leave request ${status} successfully.`,
      requestId,
      status
    });
  } catch (error) {
    next(error);
  }
});

export default router;
