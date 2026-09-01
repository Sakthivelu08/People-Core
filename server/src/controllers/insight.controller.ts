import { Request, Response, NextFunction } from 'express';
import { InsightService } from '../services/insight.service';
import { aiProviderService } from '../services/ai_provider.service';

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
      const provider = (req.query?.provider as 'gemini' | 'ollama' | 'heuristic') || 'gemini';
      const baseInsight = await InsightService.getNarrativeInsights();
      const risks = (await InsightService.getAttritionRisks()) || [];
      const highRiskCount = Array.isArray(risks) ? risks.filter((r: any) => r.riskLevel === 'high').length : 0;

      const dynamicSummary = await aiProviderService.generateExecutiveSummary(provider, {
        highRiskCount,
        totalEmployees: Array.isArray(risks) ? risks.length : 0,
        topRisks: Array.isArray(risks) ? risks.slice(0, 3).map((r: any) => ({ name: r.name, dept: r.department, score: r.riskScore })) : []
      });

      res.json({
        narrative: dynamicSummary || baseInsight.narrative,
        provider,
        generatedAt: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
}
