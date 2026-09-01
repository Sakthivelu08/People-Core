import { TestBed, ComponentFixture } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AdminDashboardComponent } from './admin-dashboard.component';
import { ApiService } from '../../../services/api.service';
import { SnackbarService } from '../../../core/services/snackbar.service';

describe('AdminDashboardComponent Unit Tests', () => {
  let fixture: ComponentFixture<AdminDashboardComponent>;
  let component: AdminDashboardComponent;
  let mockApi: any;
  let mockSnackbar: any;

  beforeEach(async () => {
    mockApi = {
      getEmployees: jasmine.createSpy('getEmployees').and.returnValue(of([{ id: '1' }])),
      getLeaveRequests: jasmine.createSpy('getLeaveRequests').and.returnValue(of([
        { id: 'l1', status: 'pending', name: 'John' }
      ])),
      getAttritionRisk: jasmine.createSpy('getAttritionRisk').and.returnValue(of([
        { name: 'John', risk_level: 'high', risk_score: 85 }
      ])),
      getOnboardingTasks: jasmine.createSpy('getOnboardingTasks').and.returnValue(of([
        { id: 't1', completed: 0 }
      ])),
      approveLeaveRequest: jasmine.createSpy('approveLeaveRequest').and.returnValue(of({})),
      rejectLeaveRequest: jasmine.createSpy('rejectLeaveRequest').and.returnValue(of({}))
    };

    mockSnackbar = {
      success: jasmine.createSpy('success'),
      error: jasmine.createSpy('error'),
      info: jasmine.createSpy('info')
    };

    await TestBed.configureTestingModule({
      imports: [AdminDashboardComponent],
      providers: [
        { provide: ApiService, useValue: mockApi },
        { provide: SnackbarService, useValue: mockSnackbar }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load dashboard metrics', () => {
    expect(component).toBeTruthy();
    expect(component.stats().totalEmployees).toBe(1);
    expect(component.stats().pendingLeaves).toBe(1);
    expect(component.stats().highRiskCount).toBe(1);
    expect(component.stats().onboardingOpen).toBe(1);
  });

  it('should handle API errors during loadData', () => {
    mockApi.getEmployees.and.returnValue(throwError(() => new Error('Err')));
    mockApi.getLeaveRequests.and.returnValue(throwError(() => new Error('Err')));
    mockApi.getAttritionRisk.and.returnValue(throwError(() => new Error('Err')));
    mockApi.getOnboardingTasks.and.returnValue(throwError(() => new Error('Err')));

    component.loadData();
    expect(mockSnackbar.error).toHaveBeenCalledWith('Failed to load employee count.');
    expect(mockSnackbar.error).toHaveBeenCalledWith('Failed to load leave requests list.');
    expect(mockSnackbar.error).toHaveBeenCalledWith('Failed to load attrition metrics.');
    expect(mockSnackbar.error).toHaveBeenCalledWith('Failed to load onboarding status.');
  });

  it('should approve leave request and handle error', () => {
    component.approveLeave('l1');
    expect(mockApi.approveLeaveRequest).toHaveBeenCalledWith('l1');
    expect(mockSnackbar.success).toHaveBeenCalledWith('Leave request approved!');

    mockApi.approveLeaveRequest.and.returnValue(throwError(() => new Error('Approve Error')));
    component.approveLeave('l2');
    expect(mockSnackbar.error).toHaveBeenCalledWith('Failed to approve leave request.');
  });

  it('should reject leave request and handle error', () => {
    component.rejectLeave('l1');
    expect(mockApi.rejectLeaveRequest).toHaveBeenCalledWith('l1');
    expect(mockSnackbar.info).toHaveBeenCalledWith('Leave request rejected.');

    mockApi.rejectLeaveRequest.and.returnValue(throwError(() => new Error('Reject Error')));
    component.rejectLeave('l2');
    expect(mockSnackbar.error).toHaveBeenCalledWith('Failed to reject leave request.');
  });
});
