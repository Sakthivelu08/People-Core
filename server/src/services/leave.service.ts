import { pool } from '../config/db';
import { v4 as uuidv4 } from 'uuid';
import { getCache, setCache, invalidateCache } from '../config/redis';

export interface CreateLeaveDto {
  type: string;
  start_date: string;
  end_date: string;
  days: number;
  reason?: string;
}

export class LeaveService {
  static async getEmployeeLeaveBalance(employeeId: string, year: number = new Date().getFullYear()) {
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

    return {
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
  }

  static async getBalancesCached(employeeId: string) {
    const cacheKey = `leaves:balances:${employeeId}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return cached;
    }

    const summary = await this.getEmployeeLeaveBalance(employeeId);
    await setCache(cacheKey, summary, 300); // 5 mins cache
    return summary;
  }

  static async getLeaveRequests(isAdmin: boolean, employeeId: string) {
    const cacheKey = isAdmin ? 'leaves:requests:all' : `leaves:requests:emp:${employeeId}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return cached;
    }

    let sql = `
      SELECT lr.*, e.name as employee_name, e.email as employee_email, r.name as reviewer_name
      FROM leave_requests lr
      JOIN employees e ON lr.employee_id = e.id
      LEFT JOIN employees r ON lr.reviewed_by = r.id
    `;
    const params: any[] = [];

    if (!isAdmin) {
      sql += ' WHERE lr.employee_id = ?';
      params.push(employeeId);
    }

    sql += ' ORDER BY lr.applied_on DESC, lr.start_date DESC';

    const [rows] = await pool.execute(sql, params);
    await setCache(cacheKey, rows, 300); // 5 mins cache
    return rows;
  }

  static async createLeaveRequest(employeeId: string, dto: CreateLeaveDto) {
    const leaveType = dto.type.toLowerCase();
    const start = new Date(dto.start_date);
    const end = new Date(dto.end_date);
    const requestedDays = dto.days;

    // 1. Check leave balance
    const balance = await this.getEmployeeLeaveBalance(employeeId, start.getFullYear());
    const remaining = balance.remaining[leaveType as keyof typeof balance.remaining];

    if (requestedDays > remaining) {
      throw {
        status: 400,
        message: `Insufficient leave balance. You requested ${requestedDays} days of ${leaveType} leave, but only have ${remaining} days remaining.`
      };
    }

    // 2. Check for overlapping requests
    const [overlapRows]: any = await pool.execute(
      `SELECT COUNT(*) as count FROM leave_requests
       WHERE employee_id = ? AND status IN ('pending', 'approved')
         AND NOT (end_date < ? OR start_date > ?)`,
      [employeeId, dto.start_date, dto.end_date]
    );

    if (overlapRows[0].count > 0) {
      throw {
        status: 400,
        message: 'Overlap detected: You already have a pending or approved leave request during these dates.'
      };
    }

    // 3. Insert new request
    const requestId = uuidv4();
    const todayStr = new Date().toISOString().split('T')[0];

    await pool.execute(
      `INSERT INTO leave_requests (id, employee_id, type, start_date, end_date, days, reason, status, applied_on)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [requestId, employeeId, leaveType, dto.start_date, dto.end_date, requestedDays, dto.reason || null, todayStr]
    );

    // Invalidate caches
    await invalidateCache(`leaves:requests:emp:${employeeId}`);
    await invalidateCache('leaves:requests:all');
    await invalidateCache(`leaves:balances:${employeeId}`);

    return requestId;
  }

  static async updateLeaveRequestStatus(requestId: string, reviewerId: string, status: 'approved' | 'rejected') {
    // Get the request
    const [requests]: any = await pool.execute(
      'SELECT employee_id, status, type, days, start_date FROM leave_requests WHERE id = ?',
      [requestId]
    );

    if (!requests || requests.length === 0) {
      throw { status: 404, message: 'Leave request not found.' };
    }

    const request = requests[0];
    if (request.status !== 'pending') {
      throw { status: 400, message: `Cannot update status. The request has already been ${request.status}.` };
    }

    // If approving, re-check remaining balance to avoid race conditions
    if (status === 'approved') {
      const year = new Date(request.start_date).getFullYear();
      const balance = await this.getEmployeeLeaveBalance(request.employee_id, year);
      const remaining = balance.remaining[request.type as keyof typeof balance.remaining];

      if (request.days > remaining) {
        throw {
          status: 400,
          message: `Cannot approve. The employee has insufficient leave balance (${remaining} days remaining, requested ${request.days} days).`
        };
      }
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Update status
    await pool.execute(
      `UPDATE leave_requests
       SET status = ?, reviewed_by = ?, reviewed_on = ?
       WHERE id = ?`,
      [status, reviewerId, todayStr, requestId]
    );

    // Invalidate caches
    await invalidateCache('leaves:requests:all');
    await invalidateCache(`leaves:requests:emp:${request.employee_id}`);
    await invalidateCache(`leaves:balances:${request.employee_id}`);

    return { requestId, status };
  }
}
