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

describe('PeopleCore API Routes Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExecute.mockImplementation(async (sql: string, params?: any[]) => {
      if (sql.includes('UPDATE onboarding_tasks')) {
        return [{ affectedRows: 1 }, []];
      }
      if (sql.includes('UPDATE leave_requests')) {
        return [{ affectedRows: 1 }, []];
      }
      if (sql.includes('employees')) {
        return [[{ id: '1', azure_oid: 'test-oid', name: 'Test User', email: 'test@example.com', role: 'Admin', department: 'Engineering' }], []];
      }
      if (sql.includes('leave_balances')) {
        return [[{ annual_total: 14, sick_total: 12, casual_total: 6, annual_used: 0, sick_used: 0, casual_used: 0 }], []];
      }
      if (sql.includes('leave_requests')) {
        return [[{ id: 'l1', employee_id: '1', type: 'annual', days: 2, status: 'pending', start_date: '2026-06-01' }], []];
      }
      if (sql.includes('onboarding_tasks')) {
        return [[{ id: 't1', employee_id: '1', title: 'Task 1', completed: 0 }], []];
      }
      if (sql.includes('engagement_scores')) {
        return [[{ id: 'e1', department: 'Engineering', score: 85, trend: 'rising', recorded_at: new Date() }], []];
      }
      if (sql.includes('attrition_scores')) {
        return [[{ id: 'a1', employee_id: '1', risk_score: 10, risk_level: 'low', key_factors: 'factors', employee_name: 'Test', department: 'Engineering' }], []];
      }
      if (sql.includes('COUNT(*)')) {
        return [[{ count: 0 }], []];
      }
      return [{ affectedRows: 1 }, []];
    });
  });

  it('GET /api/employees/me - should return user profile details', async () => {
    const res = await request(app)
      .get('/api/employees/me')
      .set('x-user-oid', 'test-oid');
    expect(res.status).toBe(200);
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

  it('GET /api/employees - should return list of all employees', async () => {
    const res = await request(app)
      .get('/api/employees')
      .set('x-user-oid', 'test-oid');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /api/leaves/requests - should submit a new leave request', async () => {
    const res = await request(app)
      .post('/api/leaves/requests')
      .set('x-user-oid', 'test-oid')
      .send({
        type: 'annual',
        start_date: '2026-06-01',
        end_date: '2026-06-03',
        days: 3,
        reason: 'Vacation'
      });

    expect(res.status).toBe(201);
    expect(res.body.message).toContain('submitted');
  });

  it('PATCH /api/leaves/requests/:id/status - should update leave request status', async () => {
    const res = await request(app)
      .patch('/api/leaves/requests/l1/status')
      .set('x-user-oid', 'test-oid')
      .send({ status: 'approved' });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('approved');
  });

  it('PATCH /api/onboarding/tasks/:id/toggle - should toggle task completed state', async () => {
    const res = await request(app)
      .patch('/api/onboarding/tasks/t1/toggle')
      .set('x-user-oid', 'test-oid')
      .send({ completed: true });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('updated');
  });

  it('GET /api/insights/attrition - should return attrition risk analysis', async () => {
    const res = await request(app)
      .get('/api/insights/attrition')
      .set('x-user-oid', 'test-oid');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
