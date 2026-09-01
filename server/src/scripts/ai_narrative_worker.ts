import mysql from 'mysql2/promise';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

// Load environment configurations
dotenv.config({ path: path.join(__dirname, '../../.env') });

const host = process.env.DB_HOST || '127.0.0.1';
const port = parseInt(process.env.DB_PORT || '3306', 10);
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const database = process.env.DB_NAME || 'peoplecore';

async function main() {
  console.log('[AI Narrative Worker] Starting background narrative generator...');

  const sslConfig = process.env.DB_SSL === 'true' ? { minVersion: 'TLSv1.2', rejectUnauthorized: false } : undefined;

  // 1. Establish database connection
  const dbConnection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
    ssl: sslConfig
  });

  try {
    // 2. Fetch current attrition insights
    const [attritionRows]: any = await dbConnection.execute(
      `SELECT ast.risk_score, ast.risk_level, ast.key_factors, e.name as employee_name, e.department
       FROM attrition_scores ast
       JOIN employees e ON ast.employee_id = e.id`
    );

    // 3. Fetch engagement scores
    const [engagementRows]: any = await dbConnection.execute(
      `SELECT es.department, es.score, es.trend
       FROM engagement_scores es
       INNER JOIN (
         SELECT department, MAX(recorded_at) as max_date
         FROM engagement_scores
         GROUP BY department
       ) grouped ON es.department = grouped.department AND es.recorded_at = grouped.max_date`
    );

    let narrative = '';
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey && apiKey.trim() !== '') {
      console.log('[AI Narrative Worker] Found GEMINI_API_KEY. Querying Gemini Live API...');
      try {
        const ai = new GoogleGenAI({ apiKey });
        
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

        narrative = (response.text || '').trim();
        console.log('[AI Narrative Worker] Successfully generated narrative report using Gemini API.');
      } catch (geminiError: any) {
        console.error('[AI Narrative Worker] Gemini API call failed. Falling back to local engine:', geminiError.message);
      }
    }

    // 4. Fallback: Dynamic Rule-Based Narrative Generator
    if (!narrative) {
      console.log('[AI Narrative Worker] Using dynamic rule-based narrative engine.');
      
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

      narrative = `Based on current workforce data, ${riskSummary} The ${lowestEngagementDept} department shows a ${lowestTrend} engagement trend (${lowestScore}/100), which correlates with critical workforce signals. Engineering remains the strongest department with rising engagement. Recommended immediate actions: schedule a 1:1 retention conversation with the affected team members, and run a ${lowestEngagementDept} team pulse survey this week.`;
    }

    // 5. Save the generated report to narrative_insights table
    console.log('[AI Narrative Worker] Saving narrative report to database...');
    // We clear older rows to keep only the latest reports or simply append.
    // Clean up older reports first so the table doesn't grow indefinitely:
    await dbConnection.execute('DELETE FROM narrative_insights');
    
    // Insert new narrative
    await dbConnection.execute(
      'INSERT INTO narrative_insights (id, narrative, generated_at) VALUES (UUID(), ?, NOW())',
      [narrative]
    );

    console.log('[AI Narrative Worker] Narrative saved successfully. Summary:');
    console.log(` -> "${narrative.substring(0, 100)}..."`);
  } catch (err: any) {
    console.error('[AI Narrative Worker] Execution failed:', err.message);
  } finally {
    await dbConnection.end();
    console.log('[AI Narrative Worker] Background worker finished.');
  }
}

main().catch((err) => {
  console.error('[AI Narrative Worker] Fatal error:', err);
  process.exit(1);
});
