import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { OnboardingController } from '../controllers/onboarding.controller';

const router = Router();

// GET /api/onboarding/tasks - Get onboarding tasks
router.get('/tasks', authenticate, OnboardingController.getAll);

// PATCH /api/onboarding/tasks/:id/toggle - Toggle task completion status
router.patch('/tasks/:id/toggle', authenticate, OnboardingController.toggle);

export default router;
