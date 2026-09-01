import { EmployeeService } from '../services/employee.service';
import { LeaveService } from '../services/leave.service';
import { OnboardingService } from '../services/onboarding.service';
import { InsightService } from '../services/insight.service';
import { pool } from '../config/db';
import * as redisModule from '../config/redis';

jest.mock('../config/db', () => ({
  pool: {
    execute: jest.fn(),
    getConnection: jest.fn()
  }
}));

jest.mock('../config/redis', () => ({
  getCache: jest.fn().mockResolvedValue(null),
  setCache: jest.fn().mockResolvedValue(undefined),
  invalidateCache: jest.fn().mockResolvedValue(undefined),
  invalidatePattern: jest.fn().mockResolvedValue(undefined)
}));

const mockExecute = pool.execute as jest.Mock;
const mockGetConnection = pool.getConnection as jest.Mock;
const mockGetCache = redisModule.getCache as jest.Mock;

describe('Service Tier Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('EmployeeService', () => {
    it('getProfileById - returns profile if found', async () => {
      mockExecute.mockResolvedValueOnce([[{ id: 'e1', name: 'Alice' }]]);
      const res = await EmployeeService.getProfileById('e1');
      expect(res).toEqual({ id: 'e1', name: 'Alice' });
    });

    it('getProfileById - returns null if not found', async () => {
      mockExecute.mockResolvedValueOnce([[]]);
      const res = await EmployeeService.getProfileById('invalid');
      expect(res).toBeNull();
    });

    it('getAllEmployees - uses cache if present', async () => {
      mockGetCache.mockResolvedValueOnce([{ id: 'e1', name: 'Alice' }]);
      const res = await EmployeeService.getAllEmployees();
      expect(res).toEqual([{ id: 'e1', name: 'Alice' }]);
    });

    it('getAllEmployees - queries DB if cache empty', async () => {
      mockGetCache.mockResolvedValueOnce(null);
      mockExecute.mockResolvedValueOnce([[{ id: 'e1', name: 'Alice' }]]);
      const res = await EmployeeService.getAllEmployees();
      expect(res).toEqual([{ id: 'e1', name: 'Alice' }]);
    });

    it('registerEmployee - completes transaction successfully', async () => {
      const mockConn = {
        beginTransaction: jest.fn(),
        execute: jest.fn().mockResolvedValue([{ affectedRows: 1 }]),
        commit: jest.fn(),
        rollback: jest.fn(),
        release: jest.fn()
      };
      mockGetConnection.mockResolvedValueOnce(mockConn);

      const id = await EmployeeService.registerEmployee({
        azure_oid: 'oid-123',
        name: 'Bob',
        email: 'bob@example.com'
      });

      expect(id).toBeDefined();
      expect(mockConn.beginTransaction).toHaveBeenCalled();
      expect(mockConn.commit).toHaveBeenCalled();
      expect(mockConn.release).toHaveBeenCalled();
    });

    it('registerEmployee - rollbacks transaction on error', async () => {
      const mockConn = {
        beginTransaction: jest.fn(),
        execute: jest.fn().mockRejectedValue(new Error('DB Error')),
        commit: jest.fn(),
        rollback: jest.fn(),
        release: jest.fn()
      };
      mockGetConnection.mockResolvedValueOnce(mockConn);

      await expect(EmployeeService.registerEmployee({
        azure_oid: 'oid-123',
        name: 'Bob',
        email: 'bob@example.com'
      })).rejects.toThrow('DB Error');

      expect(mockConn.rollback).toHaveBeenCalled();
      expect(mockConn.release).toHaveBeenCalled();
    });
  });

  describe('LeaveService', () => {
    it('getEmployeeLeaveBalance - calculates balance correctly', async () => {
      mockExecute
        .mockResolvedValueOnce([[{ annual_total: 14, sick_total: 12, casual_total: 6 }]])
        .mockResolvedValueOnce([[{ type: 'annual', total_days: '4' }]]);

      const balance = await LeaveService.getEmployeeLeaveBalance('e1', 2026);
      expect(balance.allocated.annual).toBe(14);
      expect(balance.used.annual).toBe(4);
      expect(balance.remaining.annual).toBe(10);
    });

    it('getBalancesCached - returns cached balance', async () => {
      mockGetCache.mockResolvedValueOnce({ remaining: { annual: 10 } });
      const res = await LeaveService.getBalancesCached('e1');
      expect(res).toEqual({ remaining: { annual: 10 } });
    });

    it('getLeaveRequests - returns admin vs employee requests', async () => {
      mockGetCache.mockResolvedValue(null);
      mockExecute.mockResolvedValueOnce([[{ id: 'l1', type: 'annual' }]]);

      const adminRes = await LeaveService.getLeaveRequests(true, 'e1');
      expect(adminRes).toEqual([{ id: 'l1', type: 'annual' }]);

      mockExecute.mockResolvedValueOnce([[{ id: 'l2', type: 'sick' }]]);
      const empRes = await LeaveService.getLeaveRequests(false, 'e1');
      expect(empRes).toEqual([{ id: 'l2', type: 'sick' }]);
    });

    it('createLeaveRequest - fails on insufficient balance', async () => {
      jest.spyOn(LeaveService, 'getEmployeeLeaveBalance').mockResolvedValueOnce({
        allocated: { annual: 14, sick: 12, casual: 6 },
        used: { annual: 10, sick: 0, casual: 0 },
        remaining: { annual: 2, sick: 12, casual: 6 }
      });

      await expect(LeaveService.createLeaveRequest('e1', {
        type: 'annual',
        start_date: '2026-06-01',
        end_date: '2026-06-05',
        days: 5
      })).rejects.toEqual({
        status: 400,
        message: expect.stringContaining('Insufficient leave balance')
      });
    });

    it('createLeaveRequest - fails on overlapping dates', async () => {
      jest.spyOn(LeaveService, 'getEmployeeLeaveBalance').mockResolvedValueOnce({
        allocated: { annual: 14, sick: 12, casual: 6 },
        used: { annual: 0, sick: 0, casual: 0 },
        remaining: { annual: 14, sick: 12, casual: 6 }
      });
      mockExecute.mockResolvedValueOnce([[{ count: 1 }]]);

      await expect(LeaveService.createLeaveRequest('e1', {
        type: 'annual',
        start_date: '2026-06-01',
        end_date: '2026-06-03',
        days: 3
      })).rejects.toEqual({
        status: 400,
        message: expect.stringContaining('Overlap detected')
      });
    });

    it('createLeaveRequest - creates request successfully', async () => {
      jest.spyOn(LeaveService, 'getEmployeeLeaveBalance').mockResolvedValueOnce({
        allocated: { annual: 14, sick: 12, casual: 6 },
        used: { annual: 0, sick: 0, casual: 0 },
        remaining: { annual: 14, sick: 12, casual: 6 }
      });
      mockExecute.mockResolvedValueOnce([[{ count: 0 }]]);
      mockExecute.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const id = await LeaveService.createLeaveRequest('e1', {
        type: 'annual',
        start_date: '2026-06-01',
        end_date: '2026-06-03',
        days: 3
      });
      expect(id).toBeDefined();
    });

    it('updateLeaveRequestStatus - throws 404 if request not found', async () => {
      mockExecute.mockResolvedValueOnce([[]]);
      await expect(LeaveService.updateLeaveRequestStatus('invalid', 'admin1', 'approved'))
        .rejects.toEqual({ status: 404, message: 'Leave request not found.' });
    });

    it('updateLeaveRequestStatus - throws 400 if already processed', async () => {
      mockExecute.mockResolvedValueOnce([[{ status: 'approved' }]]);
      await expect(LeaveService.updateLeaveRequestStatus('r1', 'admin1', 'approved'))
        .rejects.toEqual({ status: 400, message: expect.stringContaining('already been approved') });
    });

    it('updateLeaveRequestStatus - approves request successfully', async () => {
      mockExecute.mockResolvedValueOnce([[{ employee_id: 'e1', status: 'pending', type: 'annual', days: 2, start_date: '2026-06-01' }]]);
      jest.spyOn(LeaveService, 'getEmployeeLeaveBalance').mockResolvedValueOnce({
        allocated: { annual: 14, sick: 12, casual: 6 },
        used: { annual: 0, sick: 0, casual: 0 },
        remaining: { annual: 14, sick: 12, casual: 6 }
      });
      mockExecute.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const res = await LeaveService.updateLeaveRequestStatus('r1', 'admin1', 'approved');
      expect(res).toEqual({ requestId: 'r1', status: 'approved' });
    });
  });

  describe('OnboardingService', () => {
    it('getOnboardingTasks - returns tasks for employee or admin', async () => {
      mockExecute.mockResolvedValueOnce([[{ id: 't1', title: 'Task 1' }]]);
      const res = await OnboardingService.getOnboardingTasks('Employee', 'e1');
      expect(res).toEqual([{ id: 't1', title: 'Task 1' }]);
    });

    it('toggleTaskCompletion - throws 404 if not found', async () => {
      mockExecute.mockResolvedValueOnce([[]]);
      await expect(OnboardingService.toggleTaskCompletion('Employee', 'e1', 't99'))
        .rejects.toEqual({ status: 404, message: 'Onboarding task not found.' });
    });

    it('toggleTaskCompletion - throws 403 if user does not own task', async () => {
      mockExecute.mockResolvedValueOnce([[{ id: 't1', employee_id: 'other-user', completed: 0 }]]);
      await expect(OnboardingService.toggleTaskCompletion('Employee', 'e1', 't1'))
        .rejects.toEqual({ status: 403, message: expect.stringContaining('Forbidden') });
    });

    it('toggleTaskCompletion - toggles state successfully', async () => {
      mockExecute.mockResolvedValueOnce([[{ id: 't1', employee_id: 'e1', completed: 0 }]]);
      mockExecute.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const res = await OnboardingService.toggleTaskCompletion('Employee', 'e1', 't1');
      expect(res.completed).toBe(true);
    });
  });

  describe('InsightService', () => {
    it('getAttritionRisks - returns formatted risk scores', async () => {
      mockExecute.mockResolvedValueOnce([[
        { id: 'a1', employee_id: 'e1', risk_score: '25.5', risk_level: 'low', key_factors: 'checkins,tenure', employee_name: 'Alice', employee_email: 'a@ex.com', department: 'Eng', job_title: 'Dev' }
      ]]);

      const res = await InsightService.getAttritionRisks();
      expect(res[0].riskScore).toBe(25.5);
      expect(res[0].keyFactors).toEqual(['checkins', 'tenure']);
    });

    it('getEngagementScores - returns formatted engagement scores', async () => {
      mockExecute.mockResolvedValueOnce([[
        { id: 'eg1', department: 'Eng', score: '88.0', trend: 'rising' }
      ]]);

      const res = await InsightService.getEngagementScores();
      expect(res[0].score).toBe(88);
      expect(res[0].trend).toBe('rising');
    });

    it('getNarrativeInsights - returns cached narrative if present', async () => {
      mockExecute.mockResolvedValueOnce([[{ narrative: 'Report narrative', generated_at: '2026-06-01' }]]);

      const res = await InsightService.getNarrativeInsights();
      expect(res.narrative).toBe('Report narrative');
    });

    it('getNarrativeInsights - generates fallback narrative if cache is empty', async () => {
      mockExecute
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[{ risk_score: '80.0', risk_level: 'high', key_factors: 'tenure', employee_name: 'Bob', department: 'Sales' }]])
        .mockResolvedValueOnce([[{ department: 'Sales', score: '60.0', trend: 'declining' }]]);

      const res = await InsightService.getNarrativeInsights();
      expect(res.narrative).toContain('Bob (Sales)');
      expect(res.info).toBe('fallback inline generation');
    });
  });
});
