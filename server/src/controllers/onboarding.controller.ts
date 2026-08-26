import { Request, Response, NextFunction } from 'express';
import { OnboardingService } from '../services/onboarding.service';

export class OnboardingController {
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const targetEmployeeId = (req.query.employee_id || req.query.employeeId) as string;
      const tasks = await OnboardingService.getOnboardingTasks(
        req.user?.role || 'Employee',
        req.user!.id,
        targetEmployeeId
      );
      res.json(tasks);
    } catch (error) {
      next(error);
    }
  }

  static async toggle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const taskId = req.params.id;
      const result = await OnboardingService.toggleTaskCompletion(
        req.user?.role || 'Employee',
        req.user!.id,
        taskId
      );

      res.json({
        message: 'Onboarding task updated successfully.',
        taskId: result.taskId,
        completed: result.completed,
        completed_date: result.completed_date
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
