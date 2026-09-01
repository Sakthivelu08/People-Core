import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { API_CONFIG } from '../core/constants/config.constants';

describe('ApiService Unit Tests', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService]
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('getProfile - fetches current user profile', () => {
    service.getProfile().subscribe(res => {
      expect(res.name).toBe('Test User');
    });

    const req = httpMock.expectOne(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.employeeMe}`);
    expect(req.request.method).toBe('GET');
    req.flush({ name: 'Test User' });
  });

  it('getEmployees - fetches list of employees', () => {
    service.getEmployees().subscribe(res => {
      expect(res.length).toBe(1);
    });

    const req = httpMock.expectOne(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.employees}`);
    expect(req.request.method).toBe('GET');
    req.flush([{ id: '1' }]);
  });

  it('registerEmployee - posts new employee data', () => {
    service.registerEmployee({ name: 'New User' }).subscribe(res => {
      expect(res.id).toBe('2');
    });

    const req = httpMock.expectOne(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.employees}`);
    expect(req.request.method).toBe('POST');
    req.flush({ id: '2' });
  });

  it('getLeaveBalances & getLeaveRequests - fetches leave data', () => {
    service.getLeaveBalances().subscribe(res => expect(res).toBeDefined());
    service.getLeaveRequests().subscribe(res => expect(res).toBeDefined());

    const req1 = httpMock.expectOne(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.leaveBalances}`);
    const req2 = httpMock.expectOne(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.leaveRequests}`);
    req1.flush({});
    req2.flush([]);
  });

  it('submitLeaveRequest, approveLeaveRequest, rejectLeaveRequest - performs leave mutations', () => {
    service.submitLeaveRequest({ type: 'annual', start_date: '2026-06-01', end_date: '2026-06-02', days: 2, reason: 'trip' }).subscribe(res => expect(res).toBeDefined());
    service.approveLeaveRequest('l1').subscribe(res => expect(res).toBeDefined());
    service.rejectLeaveRequest('l1').subscribe(res => expect(res).toBeDefined());

    const req1 = httpMock.expectOne(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.leaveRequests}`);
    const req2 = httpMock.expectOne(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.leaveRequests}/l1/approve`);
    const req3 = httpMock.expectOne(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.leaveRequests}/l1/reject`);

    expect(req1.request.method).toBe('POST');
    expect(req2.request.method).toBe('PATCH');
    expect(req3.request.method).toBe('PATCH');

    req1.flush({});
    req2.flush({});
    req3.flush({});
  });

  it('getOnboardingTasks - fetches tasks with and without employeeId', () => {
    service.getOnboardingTasks('e1').subscribe(res => expect(res).toBeDefined());
    const req1 = httpMock.expectOne(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.onboardingTasks}?employeeId=e1`);
    expect(req1.request.method).toBe('GET');
    req1.flush([]);

    service.getOnboardingTasks().subscribe(res => expect(res).toBeDefined());
    const req2 = httpMock.expectOne(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.onboardingTasks}`);
    expect(req2.request.method).toBe('GET');
    req2.flush([]);
  });

  it('toggleOnboardingTask - toggles task state', () => {
    service.toggleOnboardingTask('t1').subscribe(res => expect(res).toBeDefined());
    const req = httpMock.expectOne(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.onboardingTasks}/t1/toggle`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });

  it('getAttritionRisk, getEngagementScores, getNarrativeSummary - fetches insights', () => {
    service.getAttritionRisk().subscribe(res => expect(res).toBeDefined());
    service.getEngagementScores().subscribe(res => expect(res).toBeDefined());
    service.getNarrativeSummary().subscribe(res => expect(res).toBeDefined());

    const req1 = httpMock.expectOne(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.attrition}`);
    const req2 = httpMock.expectOne(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.engagement}`);
    const req3 = httpMock.expectOne(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.narrative}`);

    req1.flush([]);
    req2.flush([]);
    req3.flush({});
  });
});
