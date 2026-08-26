import { Request, Response, NextFunction } from 'express';
import { InsightService } from '../services/insight.service';

export class InsightController {
  static async getAttrition(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const risks = await InsightService.getAttritionRisks();
      res.json(risks);
    } catch (error) {
      next(error);
    }
  }

  static async getEngagement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const scores = await InsightService.getEngagementScores();
      res.json(scores);
    } catch (error) {
      next(error);
    }
  }

  static async getNarrative(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const insight = await InsightService.getNarrativeInsights();
      res.json(insight);
    } catch (error) {
      next(error);
    }
  }
}
