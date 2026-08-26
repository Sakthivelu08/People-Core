import { Router } from 'express';
import { authenticate, authorizeAdmin } from '../middlewares/auth';
import { EmployeeController } from '../controllers/employee.controller';

const router = Router();

// GET /api/employees/me - Get currently logged-in user profile
router.get('/me', authenticate, EmployeeController.getMe);

// GET /api/employees - List all employees (Admin only)
router.get('/', authenticate, authorizeAdmin, EmployeeController.getAll);

// POST /api/employees - Register a new employee (Admin only)
router.post('/', authenticate, authorizeAdmin, EmployeeController.register);

export default router;
