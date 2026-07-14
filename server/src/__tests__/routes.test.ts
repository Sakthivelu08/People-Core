import request from 'supertest';
import express from 'express';
import employeeRouter from '../routes/employee.routes';
import leaveRouter from '../routes/leave.routes';
import onboardingRouter from '../routes/onboarding.routes';
import insightRouter from '../routes/insight.routes';
import { pool } from '../config/db';

jest.mock('../config/db', () => {
  return {
    pool: {
      execute: jest.fn(),
      getConnection: jest.fn().mockResolvedValue({
        release: jest.fn()
      })
    },
    checkConnection: jest.fn().mockResolvedValue(true),
    query: jest.fn()
  };
});

const app = express();
app.use(express.json());
app.use('/api/employees', employeeRouter);
app.use('/api/leaves', leaveRouter);
app.use('/api/onboarding', onboardingRouter);
app.use('/api/insights', insightRouter);

const mockExecute = pool.execute as jest.Mock;

describe('PeopleCore API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExecute.mockImplementation(async (sql: string, params?: any[]) => {
      if (sql.includes('FROM employees WHERE azure_oid = ?')) {
        return [[{ id: '1', azure_oid: 'test-oid', name: 'Test User', email: 'test@example.com', role: 'Employee', department: 'Engineering' }]];
      }
      if (sql.includes('FROM employees WHERE id = ?')) {
        return [[{ id: '1', azure_oid: 'test-oid', name: 'Test User', email: 'test@example.com', role: 'Employee', department: 'Engineering' }]];
      }
      if (sql.includes('FROM leave_balances')) {
        return [[{ annual_total: 14, sick_total: 12, casual_total: 6, annual_used: 0, sick_used: 0, casual_used: 0 }]];
      }
      if (sql.includes('FROM leave_requests')) {
        return [[{ id: 'l1', employee_id: '1', type: 'annual', days: 2, status: 'pending' }]];
      }
      if (sql.includes('FROM onboarding_tasks')) {
        return [[{ id: 't1', title: 'Task 1', completed: false }]];
      }
      if (sql.includes('FROM engagement_scores')) {
        return [[{ id: 'e1', department: 'Engineering', score: 85, trend: 'rising', recorded_at: new Date() }]];
      }
      if (sql.includes('FROM attrition_scores')) {
        return [[{ id: 'a1', employee_id: '1', risk_score: 10, risk_level: 'low', key_factors: 'factors', employee_name: 'Test', department: 'Engineering' }]];
      }
      return [[]];
    });
  });

  it('GET /api/employees/me - should return user profile details', async () => {
    const res = await request(app)
      .get('/api/employees/me')
      .set('x-user-oid', 'test-oid');
    expect(res.status).toBe(200);
    expect(res.status).not.toBe(404);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('Test User');
  });

  it('GET /api/leaves/balances - should return leave balances for the user', async () => {
    const res = await request(app)
      .get('/api/leaves/balances')
      .set('x-user-oid', 'test-oid');
    expect(res.status).toBe(200);
    expect(res.body.allocated).toHaveProperty('annual');
  });

  it('GET /api/leaves/requests - should return list of leave requests', async () => {
    const res = await request(app)
      .get('/api/leaves/requests')
      .set('x-user-oid', 'test-oid');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/onboarding/tasks - should return user onboarding tasks list', async () => {
    const res = await request(app)
      .get('/api/onboarding/tasks')
      .set('x-user-oid', 'test-oid');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/insights/engagement - should return list of engagement scores', async () => {
    const res = await request(app)
      .get('/api/insights/engagement')
      .set('x-user-oid', 'test-oid');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/insights/narrative - should return generated insights narrative', async () => {
    const res = await request(app)
      .get('/api/insights/narrative')
      .set('x-user-oid', 'test-oid');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('narrative');
  });
});
