import { Request, Response, NextFunction } from 'express';
import { LeaveService } from '../services/leave.service';

export class LeaveController {
  static async getBalances(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const summary = await LeaveService.getBalancesCached(req.user!.id);
      res.json(summary);
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const isAdmin = req.user?.role === 'Admin';
      const requests = await LeaveService.getLeaveRequests(isAdmin, req.user!.id);
      res.json(requests);
    } catch (error) {
      next(error);
    }
  }

  static async apply(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { type, start_date, end_date, days, reason } = req.body;

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

      const requestId = await LeaveService.createLeaveRequest(req.user!.id, {
        type: leaveType,
        start_date,
        end_date,
        days: requestedDays,
        reason
      });

      res.status(201).json({
        message: 'Leave request submitted successfully.',
        requestId
      });
    } catch (error: any) {
      if (error.status) {
        res.status(error.status).json({ error: error.message });
      } else {
        next(error);
      }
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requestId = req.params.id;
      const { status } = req.body;

      if (!status || !['approved', 'rejected'].includes(status)) {
        res.status(400).json({ error: 'Invalid status. Status must be approved or rejected.' });
        return;
      }

      const result = await LeaveService.updateLeaveRequestStatus(requestId, req.user!.id, status);

      res.json({
        message: `Leave request ${status} successfully.`,
        requestId: result.requestId,
        status: result.status
      });
    } catch (error: any) {
      if (error.status) {
        res.status(error.status).json({ error: error.message });
      } else {
        next(error);
      }
    }
  }
}
