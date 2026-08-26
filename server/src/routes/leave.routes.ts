import { Router } from 'express';
import { authenticate, authorizeAdmin } from '../middlewares/auth';
import { LeaveController } from '../controllers/leave.controller';

const router = Router();

// GET /api/leaves/balances - Get leave balances for the logged-in employee
router.get('/balances', authenticate, LeaveController.getBalances);

// GET /api/leaves/requests - List leave requests (Admins see all, employees see only their own)
router.get('/requests', authenticate, LeaveController.getAll);

// POST /api/leaves/requests - Submit a new leave request
router.post('/requests', authenticate, LeaveController.apply);

// PATCH /api/leaves/requests/:id/status - Approve or reject a request (Admin only)
router.patch('/requests/:id/status', authenticate, authorizeAdmin, LeaveController.updateStatus);

export default router;
