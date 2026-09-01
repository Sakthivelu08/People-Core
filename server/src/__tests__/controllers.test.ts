import { EmployeeController } from '../controllers/employee.controller';
import { LeaveController } from '../controllers/leave.controller';
import { OnboardingController } from '../controllers/onboarding.controller';
import { InsightController } from '../controllers/insight.controller';
import { EmployeeService } from '../services/employee.service';
import { LeaveService } from '../services/leave.service';
import { OnboardingService } from '../services/onboarding.service';
import { InsightService } from '../services/insight.service';

jest.mock('../services/employee.service');
jest.mock('../services/leave.service');
jest.mock('../services/onboarding.service');
jest.mock('../services/insight.service');

function createMockReqRes(user: any = { id: 'e1', role: 'Employee', azure_oid: 'oid1' }, body: any = {}, params: any = {}, query: any = {}) {
  const req: any = {
    user,
    body,
    params,
    query
  };
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
  };
  const next = jest.fn();
  return { req, res, next };
}

describe('Controller Tier Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('EmployeeController', () => {
    it('getMe - returns user profile', async () => {
      (EmployeeService.getProfileById as jest.Mock).mockResolvedValueOnce({ id: 'e1', name: 'Alice' });
      const { req, res, next } = createMockReqRes();

      await EmployeeController.getMe(req, res, next);
      expect(res.json).toHaveBeenCalledWith({ id: 'e1', name: 'Alice' });
    });

    it('getMe - returns 404 if profile not found', async () => {
      (EmployeeService.getProfileById as jest.Mock).mockResolvedValueOnce(null);
      const { req, res, next } = createMockReqRes();

      await EmployeeController.getMe(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Employee profile not found.' });
    });

    it('getMe - calls next on service error', async () => {
      (EmployeeService.getProfileById as jest.Mock).mockRejectedValueOnce(new Error('DB Error'));
      const { req, res, next } = createMockReqRes();

      await EmployeeController.getMe(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('getAll - returns employee directory', async () => {
      (EmployeeService.getAllEmployees as jest.Mock).mockResolvedValueOnce([{ id: 'e1' }]);
      const { req, res, next } = createMockReqRes();

      await EmployeeController.getAll(req, res, next);
      expect(res.json).toHaveBeenCalledWith([{ id: 'e1' }]);
    });

    it('getAll - calls next on error', async () => {
      (EmployeeService.getAllEmployees as jest.Mock).mockRejectedValueOnce(new Error('DB Error'));
      const { req, res, next } = createMockReqRes();

      await EmployeeController.getAll(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('register - registers employee successfully', async () => {
      (EmployeeService.registerEmployee as jest.Mock).mockResolvedValueOnce('new-emp-id');
      const { req, res, next } = createMockReqRes(
        { id: 'admin1', role: 'Admin' },
        { azure_oid: 'oid2', name: 'Bob', email: 'bob@ex.com' }
      );

      await EmployeeController.register(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('register - returns 400 on missing required fields', async () => {
      const { req, res, next } = createMockReqRes(
        { id: 'admin1', role: 'Admin' },
        { name: 'Bob' }
      );

      await EmployeeController.register(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('register - handles ER_DUP_ENTRY duplicate error', async () => {
      const dupError: any = new Error('Duplicate');
      dupError.code = 'ER_DUP_ENTRY';
      (EmployeeService.registerEmployee as jest.Mock).mockRejectedValueOnce(dupError);

      const { req, res, next } = createMockReqRes(
        { id: 'admin1', role: 'Admin' },
        { azure_oid: 'oid2', name: 'Bob', email: 'bob@ex.com' }
      );

      await EmployeeController.register(req, res, next);
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('register - calls next on generic error', async () => {
      (EmployeeService.registerEmployee as jest.Mock).mockRejectedValueOnce(new Error('Generic Error'));
      const { req, res, next } = createMockReqRes(
        { id: 'admin1', role: 'Admin' },
        { azure_oid: 'oid2', name: 'Bob', email: 'bob@ex.com' }
      );

      await EmployeeController.register(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('LeaveController', () => {
    it('getBalances - returns leave summary', async () => {
      (LeaveService.getBalancesCached as jest.Mock).mockResolvedValueOnce({ remaining: { annual: 10 } });
      const { req, res, next } = createMockReqRes();

      await LeaveController.getBalances(req, res, next);
      expect(res.json).toHaveBeenCalledWith({ remaining: { annual: 10 } });
    });

    it('getBalances - calls next on error', async () => {
      (LeaveService.getBalancesCached as jest.Mock).mockRejectedValueOnce(new Error('Error'));
      const { req, res, next } = createMockReqRes();

      await LeaveController.getBalances(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('getAll - returns list of leave requests', async () => {
      (LeaveService.getLeaveRequests as jest.Mock).mockResolvedValueOnce([{ id: 'l1' }]);
      const { req, res, next } = createMockReqRes();

      await LeaveController.getAll(req, res, next);
      expect(res.json).toHaveBeenCalledWith([{ id: 'l1' }]);
    });

    it('getAll - calls next on error', async () => {
      (LeaveService.getLeaveRequests as jest.Mock).mockRejectedValueOnce(new Error('Error'));
      const { req, res, next } = createMockReqRes();

      await LeaveController.getAll(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('apply - creates new leave request', async () => {
      (LeaveService.createLeaveRequest as jest.Mock).mockResolvedValueOnce('req-123');
      const { req, res, next } = createMockReqRes(
        { id: 'e1', role: 'Employee' },
        { type: 'annual', start_date: '2026-06-01', end_date: '2026-06-03', days: 3 }
      );

      await LeaveController.apply(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('apply - handles custom error status', async () => {
      (LeaveService.createLeaveRequest as jest.Mock).mockRejectedValueOnce({ status: 400, message: 'Insufficient' });
      const { req, res, next } = createMockReqRes(
        { id: 'e1', role: 'Employee' },
        { type: 'annual', start_date: '2026-06-01', end_date: '2026-06-03', days: 3 }
      );

      await LeaveController.apply(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('apply - calls next on generic error', async () => {
      (LeaveService.createLeaveRequest as jest.Mock).mockRejectedValueOnce(new Error('Generic'));
      const { req, res, next } = createMockReqRes(
        { id: 'e1', role: 'Employee' },
        { type: 'annual', start_date: '2026-06-01', end_date: '2026-06-03', days: 3 }
      );

      await LeaveController.apply(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('apply - returns 400 on missing parameters', async () => {
      const { req, res, next } = createMockReqRes(
        { id: 'e1', role: 'Employee' },
        { type: 'annual' }
      );

      await LeaveController.apply(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('apply - returns 400 on invalid leave type', async () => {
      const { req, res, next } = createMockReqRes(
        { id: 'e1', role: 'Employee' },
        { type: 'invalid-type', start_date: '2026-06-01', end_date: '2026-06-03', days: 3 }
      );

      await LeaveController.apply(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('apply - returns 400 on invalid start/end dates', async () => {
      const { req, res, next } = createMockReqRes(
        { id: 'e1', role: 'Employee' },
        { type: 'annual', start_date: '2026-06-05', end_date: '2026-06-01', days: 3 }
      );

      await LeaveController.apply(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('apply - returns 400 on days <= 0', async () => {
      const { req, res, next } = createMockReqRes(
        { id: 'e1', role: 'Employee' },
        { type: 'annual', start_date: '2026-06-01', end_date: '2026-06-03', days: 0 }
      );

      await LeaveController.apply(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('updateStatus - updates leave request status', async () => {
      (LeaveService.updateLeaveRequestStatus as jest.Mock).mockResolvedValueOnce({ requestId: 'l1', status: 'approved' });
      const { req, res, next } = createMockReqRes(
        { id: 'admin1', role: 'Admin' },
        { status: 'approved' },
        { id: 'l1' }
      );

      await LeaveController.updateStatus(req, res, next);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Leave request approved successfully.',
        requestId: 'l1',
        status: 'approved'
      });
    });

    it('updateStatus - handles custom error status', async () => {
      (LeaveService.updateLeaveRequestStatus as jest.Mock).mockRejectedValueOnce({ status: 404, message: 'Not found' });
      const { req, res, next } = createMockReqRes(
        { id: 'admin1', role: 'Admin' },
        { status: 'approved' },
        { id: 'l1' }
      );

      await LeaveController.updateStatus(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('updateStatus - calls next on generic error', async () => {
      (LeaveService.updateLeaveRequestStatus as jest.Mock).mockRejectedValueOnce(new Error('Generic'));
      const { req, res, next } = createMockReqRes(
        { id: 'admin1', role: 'Admin' },
        { status: 'approved' },
        { id: 'l1' }
      );

      await LeaveController.updateStatus(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('updateStatus - returns 400 on invalid status payload', async () => {
      const { req, res, next } = createMockReqRes(
        { id: 'admin1', role: 'Admin' },
        { status: 'invalid-status' },
        { id: 'l1' }
      );

      await LeaveController.updateStatus(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('OnboardingController', () => {
    it('getAll - returns onboarding tasks with employee_id query', async () => {
      (OnboardingService.getOnboardingTasks as jest.Mock).mockResolvedValueOnce([{ id: 't1' }]);
      const { req, res, next } = createMockReqRes(
        { id: 'admin1', role: 'Admin' },
        {},
        {},
        { employee_id: 'emp-123' }
      );

      await OnboardingController.getAll(req, res, next);
      expect(res.json).toHaveBeenCalledWith([{ id: 't1' }]);
    });

    it('getAll - calls next on error', async () => {
      (OnboardingService.getOnboardingTasks as jest.Mock).mockRejectedValueOnce(new Error('Error'));
      const { req, res, next } = createMockReqRes();

      await OnboardingController.getAll(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('toggle - toggles onboarding task completion', async () => {
      (OnboardingService.toggleTaskCompletion as jest.Mock).mockResolvedValueOnce({ taskId: 't1', completed: true });
      const { req, res, next } = createMockReqRes(
        { id: 'e1', role: 'Employee' },
        {},
        { id: 't1' }
      );

      await OnboardingController.toggle(req, res, next);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Onboarding task updated successfully.',
        taskId: 't1',
        completed: true,
        completed_date: undefined
      });
    });

    it('toggle - handles custom error status', async () => {
      (OnboardingService.toggleTaskCompletion as jest.Mock).mockRejectedValueOnce({ status: 403, message: 'Forbidden' });
      const { req, res, next } = createMockReqRes(
        { id: 'e1', role: 'Employee' },
        {},
        { id: 't1' }
      );

      await OnboardingController.toggle(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('toggle - calls next on generic error', async () => {
      (OnboardingService.toggleTaskCompletion as jest.Mock).mockRejectedValueOnce(new Error('Error'));
      const { req, res, next } = createMockReqRes(
        { id: 'e1', role: 'Employee' },
        {},
        { id: 't1' }
      );

      await OnboardingController.toggle(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('InsightController', () => {
    it('getAttrition - returns attrition risk data', async () => {
      (InsightService.getAttritionRisks as jest.Mock).mockResolvedValueOnce([{ riskLevel: 'low' }]);
      const { req, res, next } = createMockReqRes();

      await InsightController.getAttrition(req, res, next);
      expect(res.json).toHaveBeenCalledWith([{ riskLevel: 'low' }]);
    });

    it('getAttrition - calls next on error', async () => {
      (InsightService.getAttritionRisks as jest.Mock).mockRejectedValueOnce(new Error('Error'));
      const { req, res, next } = createMockReqRes();

      await InsightController.getAttrition(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('getEngagement - returns engagement scores', async () => {
      (InsightService.getEngagementScores as jest.Mock).mockResolvedValueOnce([{ score: 85 }]);
      const { req, res, next } = createMockReqRes();

      await InsightController.getEngagement(req, res, next);
      expect(res.json).toHaveBeenCalledWith([{ score: 85 }]);
    });

    it('getEngagement - calls next on error', async () => {
      (InsightService.getEngagementScores as jest.Mock).mockRejectedValueOnce(new Error('Error'));
      const { req, res, next } = createMockReqRes();

      await InsightController.getEngagement(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('getNarrative - returns generated narrative report', async () => {
      (InsightService.getNarrativeInsights as jest.Mock).mockResolvedValueOnce({ narrative: 'AI Summary' });
      const { req, res, next } = createMockReqRes();

      await InsightController.getNarrative(req, res, next);
      expect(res.json).toHaveBeenCalledWith({ narrative: 'AI Summary' });
    });

    it('getNarrative - calls next on error', async () => {
      (InsightService.getNarrativeInsights as jest.Mock).mockRejectedValueOnce(new Error('Error'));
      const { req, res, next } = createMockReqRes();

      await InsightController.getNarrative(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });
});
