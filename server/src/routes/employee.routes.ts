import { Router } from 'express';
import { authenticate, authorizeAdmin } from '../middlewares/auth';
import { EmployeeController } from '../controllers/employee.controller';

const router = Router();

// GET /api/employees/me - Get currently logged-in user profile
router.get('/me', authenticate, EmployeeController.getMe);

// GET /api/employees/azure-sync/status - Get Azure directory sync stats
router.get('/azure-sync/status', authenticate, authorizeAdmin, EmployeeController.getAzureSyncStatus);

// POST /api/employees/azure-sync/trigger - Trigger directory sync cycle
router.post('/azure-sync/trigger', authenticate, authorizeAdmin, EmployeeController.triggerAzureSync);

// GET /api/employees - List all employees (Admin only)
router.get('/', authenticate, authorizeAdmin, EmployeeController.getAll);

// POST /api/employees - Register a new employee (Admin only)
router.post('/', authenticate, authorizeAdmin, EmployeeController.register);

export default router;
