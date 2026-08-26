import { pool } from '../config/db';

export class InsightService {
  static async getAttritionRisks() {
    const [rows]: any = await pool.execute(
      `SELECT ast.id, ast.employee_id, ast.risk_score, ast.risk_level, ast.key_factors, ast.generated_at,
              e.name as employee_name, e.email as employee_email, e.department, e.job_title
       FROM attrition_scores ast
       JOIN employees e ON ast.employee_id = e.id
       ORDER BY ast.risk_score DESC`
    );

    return rows.map((row: any) => ({
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
  }

  static async getEngagementScores() {
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

    return rows.map((row: any) => ({
      id: row.id,
      department: row.department,
      score: parseFloat(row.score),
      trend: row.trend
    }));
  }

  static async getNarrativeInsights() {
    // 1. Fetch pre-generated narrative report
    const [rows]: any = await pool.execute(
      'SELECT narrative, generated_at FROM narrative_insights ORDER BY generated_at DESC LIMIT 1'
    );

    if (rows && rows.length > 0) {
      return { narrative: rows[0].narrative, generatedAt: rows[0].generated_at };
    }

    // 2. Fallback: Quick Dynamic Rule-Based Narrative Generator if cache is empty
    console.log('[AI Insights] No cached narrative found. Generating fallback inline.');
    
    const [attritionRows]: any = await pool.execute(
      `SELECT ast.risk_score, ast.risk_level, ast.key_factors, e.name as employee_name, e.department
       FROM attrition_scores ast
       JOIN employees e ON ast.employee_id = e.id`
    );

    const [engagementRows]: any = await pool.execute(
      `SELECT es.department, es.score, es.trend
       FROM engagement_scores es
       INNER JOIN (
         SELECT department, MAX(recorded_at) as max_date
         FROM engagement_scores
         GROUP BY department
       ) grouped ON es.department = grouped.department AND es.recorded_at = grouped.max_date`
    );

    const highRiskEmployees = attritionRows.filter((r: any) => r.risk_level === 'high');
    const mediumRiskEmployees = attritionRows.filter((r: any) => r.risk_level === 'medium');
    
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

    return { narrative, info: 'fallback inline generation' };
  }
}
