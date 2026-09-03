import fs from 'fs';
import path from 'path';
import { pool } from '../config/db';

async function exportPowerBiDatasets() {
  console.log('[PowerBI Export] Starting Power BI Dataset Export Process...');

  const outputDir = path.join(__dirname, '../../../docs/powerbi/data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 1. Export Employees Dataset
  console.log('[PowerBI Export] Exporting Employees Dataset...');
  const [employees]: any = await pool.query(
    'SELECT id, azure_oid, name, email, job_title, department, office_location, role, status, join_date FROM employees'
  );
  
  const empCsvHeader = 'id,azure_oid,name,email,job_title,department,office_location,role,status,join_date\n';
  const empCsvRows = employees.map((e: any) => 
    `"${e.id}","${e.azure_oid || ''}","${(e.name || '').replace(/"/g, '""')}","${e.email}","${e.job_title || ''}","${e.department || ''}","${e.office_location || ''}","${e.role}","${e.status}","${e.join_date ? new Date(e.join_date).toISOString().split('T')[0] : ''}"`
  ).join('\n');
  
  fs.writeFileSync(path.join(outputDir, 'employees.csv'), empCsvHeader + empCsvRows);
  console.log(`[PowerBI Export] Saved ${employees.length} employee records to docs/powerbi/data/employees.csv`);

  // 2. Export Leave Requests Dataset
  console.log('[PowerBI Export] Exporting Leave Requests Dataset...');
  const [leaveRequests]: any = await pool.query(
    'SELECT id, employee_id, type, start_date, end_date, days, status, reason, applied_on FROM leave_requests'
  );

  const leaveCsvHeader = 'id,employee_id,type,start_date,end_date,days,status,reason,applied_on\n';
  const leaveCsvRows = leaveRequests.map((l: any) => 
    `"${l.id}","${l.employee_id}","${l.type}","${l.start_date ? new Date(l.start_date).toISOString().split('T')[0] : ''}","${l.end_date ? new Date(l.end_date).toISOString().split('T')[0] : ''}",${l.days},"${l.status}","${(l.reason || '').replace(/"/g, '""')}","${l.applied_on ? new Date(l.applied_on).toISOString() : ''}"`
  ).join('\n');

  fs.writeFileSync(path.join(outputDir, 'leave_requests.csv'), leaveCsvHeader + leaveCsvRows);
  console.log(`[PowerBI Export] Saved ${leaveRequests.length} leave requests to docs/powerbi/data/leave_requests.csv`);

  // 3. Export Onboarding Tasks Dataset
  console.log('[PowerBI Export] Exporting Onboarding Tasks Dataset...');
  const [onboardingTasks]: any = await pool.query(
    'SELECT id, employee_id, title, description, category, completed, due_date FROM onboarding_tasks'
  );

  const taskCsvHeader = 'id,employee_id,title,description,category,completed,due_date\n';
  const taskCsvRows = onboardingTasks.map((t: any) => 
    `"${t.id}","${t.employee_id}","${(t.title || '').replace(/"/g, '""')}","${(t.description || '').replace(/"/g, '""')}","${t.category}",${t.completed ? 1 : 0},"${t.due_date ? new Date(t.due_date).toISOString().split('T')[0] : ''}"`
  ).join('\n');

  fs.writeFileSync(path.join(outputDir, 'onboarding_tasks.csv'), taskCsvHeader + taskCsvRows);
  console.log(`[PowerBI Export] Saved ${onboardingTasks.length} onboarding tasks to docs/powerbi/data/onboarding_tasks.csv`);

  // 4. Export Attrition Analytics Dataset
  console.log('[PowerBI Export] Exporting Attrition Analytics Dataset...');
  const [attritionScores]: any = await pool.query(
    'SELECT id, employee_id, risk_score, risk_level, key_factors, generated_at FROM attrition_scores'
  );

  const insightCsvHeader = 'id,employee_id,risk_score,risk_level,key_factors,generated_at\n';
  const insightCsvRows = attritionScores.map((i: any) => 
    `"${i.id}","${i.employee_id}",${i.risk_score},"${i.risk_level}","${(i.key_factors || '').replace(/"/g, '""')}","${i.generated_at ? new Date(i.generated_at).toISOString() : ''}"`
  ).join('\n');

  fs.writeFileSync(path.join(outputDir, 'attrition_analytics.csv'), insightCsvHeader + insightCsvRows);
  console.log(`[PowerBI Export] Saved ${attritionScores.length} attrition risk insights to docs/powerbi/data/attrition_analytics.csv`);

  console.log('[PowerBI Export] All Power BI Datasets Exported Successfully!');
  process.exit(0);
}

exportPowerBiDatasets().catch(err => {
  console.error('[PowerBI Export] Error exporting Power BI datasets:', err);
  process.exit(1);
});
