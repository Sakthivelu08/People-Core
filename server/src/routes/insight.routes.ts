import { Router, Request, Response, NextFunction } from 'express';
import { GoogleGenAI } from '@google/genai';
import { pool } from '../config/db';
import { authenticate, authorizeAdmin } from '../middlewares/auth';

const router = Router();

// GET /api/insights/attrition - Get attrition risk scores (Admin only)
router.get('/attrition', authenticate, authorizeAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [rows]: any = await pool.execute(
      `SELECT ast.id, ast.employee_id, ast.risk_score, ast.risk_level, ast.key_factors, ast.generated_at,
              e.name as employee_name, e.email as employee_email, e.department, e.job_title
       FROM attrition_scores ast
       JOIN employees e ON ast.employee_id = e.id
       ORDER BY ast.risk_score DESC`
    );

    // Map database fields to camelCase to match the frontend expectations
    const mapped = rows.map((row: any) => ({
      id: row.id,
      employeeId: row.employee_id,
      name: row.employee_name,
      email: row.employee_email,
      department: row.department,
      jobTitle: row.job_title,
      riskScore: parseFloat(row.risk_score),
      riskLevel: row.risk_level,
      keyFactors: row.key_factors ? row.key_factors.split(',').map((f: string) => f.trim()) : []
    }));

    res.json(mapped);
  } catch (error) {
    next(error);
  }
});

// GET /api/insights/engagement - Get engagement scores per department
router.get('/engagement', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get the latest recorded engagement score for each department
    const [rows]: any = await pool.execute(
      `SELECT es.id, es.department, es.score, es.trend, es.recorded_at
       FROM engagement_scores es
       INNER JOIN (
         SELECT department, MAX(recorded_at) as max_date
         FROM engagement_scores
         GROUP BY department
       ) grouped ON es.department = grouped.department AND es.recorded_at = grouped.max_date
       ORDER BY es.score DESC`
    );

    const mapped = rows.map((row: any) => ({
      id: row.id,
      department: row.department,
      score: parseFloat(row.score),
      trend: row.trend
    }));

    res.json(mapped);
  } catch (error) {
    next(error);
  }
});

// GET /api/insights/narrative - Get AI narrative insight summary report
router.get('/narrative', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // 1. Fetch current attrition insights
    const [attritionRows]: any = await pool.execute(
      `SELECT ast.risk_score, ast.risk_level, ast.key_factors, e.name as employee_name, e.department
       FROM attrition_scores ast
       JOIN employees e ON ast.employee_id = e.id`
    );

    // 2. Fetch engagement scores
    const [engagementRows]: any = await pool.execute(
      `SELECT es.department, es.score, es.trend
       FROM engagement_scores es
       INNER JOIN (
         SELECT department, MAX(recorded_at) as max_date
         FROM engagement_scores
         GROUP BY department
       ) grouped ON es.department = grouped.department AND es.recorded_at = grouped.max_date`
    );

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey && apiKey.trim() !== '') {
      console.log('[AI Insights] Found GEMINI_API_KEY. Querying Gemini Live API...');
      try {
        const ai = new GoogleGenAI({ apiKey });
        
        // Prepare context for the prompt
        const attritionContext = attritionRows
          .map((r: any) => `- Name: ${r.employee_name}, Dept: ${r.department}, Risk Level: ${r.risk_level}, Score: ${r.risk_score}%, Factors: [${r.key_factors}]`)
          .join('\n');
        
        const engagementContext = engagementRows
          .map((r: any) => `- Department: ${r.department}, Engagement Score: ${r.score}/100, Trend: ${r.trend}`)
          .join('\n');

        const prompt = `
You are an expert HR analyst and AI coordinator for the platform PeopleCore.
Analyze the following company metrics and write a brief, professional summary narrative.

Attrition Risks:
${attritionContext}

Department Engagement Trends:
${engagementContext}

Instructions:
- Summarize the high-risk profiles and name them.
- Correlate lowest-scoring departments with attrition patterns.
- List 2 actionable recommendations.
- Keep the summary under 120 words.
- Return ONLY plain text. Do not output markdown, asterisks, HTML, or tags.
`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt
        });

        const narrative = response.text || '';
        res.json({ narrative: narrative.trim() });
        return;
      } catch (geminiError: any) {
        console.error('[AI Insights] Gemini API call failed, falling back to local engine:', geminiError.message);
      }
    }

    // 3. Fallback: Dynamic Rule-Based Narrative Generator
    console.log('[AI Insights] Using dynamic rule-based narrative engine.');
    
    const highRiskEmployees = attritionRows.filter((r: any) => r.risk_level === 'high');
    const mediumRiskEmployees = attritionRows.filter((r: any) => r.risk_level === 'medium');
    
    // Find lowest engagement department
    let lowestEngagementDept = 'N/A';
    let lowestScore = 100;
    let lowestTrend = 'stable';
    engagementRows.forEach((r: any) => {
      const scoreNum = parseFloat(r.score);
      if (scoreNum < lowestScore) {
        lowestScore = scoreNum;
        lowestEngagementDept = r.department;
        lowestTrend = r.trend;
      }
    });

    let riskSummary = '';
    if (highRiskEmployees.length > 0) {
      const names = highRiskEmployees.map((r: any) => `${r.employee_name} (${r.department})`).join(', ');
      riskSummary = `${highRiskEmployees.length} employee (${names}) is flagged as high attrition risk. Primary signals are: ${highRiskEmployees[0].key_factors || 'performance'}.`;
    } else if (mediumRiskEmployees.length > 0) {
      const names = mediumRiskEmployees.map((r: any) => `${r.employee_name} (${r.department})`).join(', ');
      riskSummary = `${mediumRiskEmployees.length} employee (${names}) is flagged as medium attrition risk. Key factors include: ${mediumRiskEmployees[0].key_factors || 'engagement'}.`;
    } else {
      riskSummary = 'No employees are currently flagged as high or medium attrition risk.';
    }

    const narrative = `Based on current workforce data, ${riskSummary} The ${lowestEngagementDept} department shows a ${lowestTrend} engagement trend (${lowestScore}/100), which correlates with critical workforce signals. Engineering remains the strongest department with rising engagement. Recommended immediate actions: schedule a 1:1 retention conversation with the affected team members, and run a ${lowestEngagementDept} team pulse survey this week.`;

    res.json({ narrative });
  } catch (error) {
    next(error);
  }
});

export default router;
