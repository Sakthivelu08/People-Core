import { Router } from 'express';
import { authenticate, authorizeAdmin } from '../middlewares/auth';
import { InsightController } from '../controllers/insight.controller';

const router = Router();

// GET /api/insights/attrition - Get attrition risk scores (Admin only)
router.get('/attrition', authenticate, authorizeAdmin, InsightController.getAttrition);

// GET /api/insights/engagement - Get engagement scores per department
router.get('/engagement', authenticate, InsightController.getEngagement);

// GET /api/insights/narrative - Get AI narrative insight summary report
router.get('/narrative', authenticate, InsightController.getNarrative);

export default router;
