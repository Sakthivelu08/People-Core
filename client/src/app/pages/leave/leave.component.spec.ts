import { TestBed, ComponentFixture } from '@angular/core/testing';
import { LeaveComponent } from './leave.component';
import { LeaveService } from '../../core/services/leave.service';
import { LeaveRequest } from '../../core/models/leave.model';

const mockRequests: LeaveRequest[] = [
  { id: '1', type: 'annual', startDate: '2026-05-01', endDate: '2026-05-03', days: 3, reason: 'Vacation trip', status: 'approved', appliedOn: '2026-04-20' },
  { id: '2', type: 'sick',   startDate: '2026-06-01', endDate: '2026-06-01', days: 1, reason: 'Fever and rest', status: 'pending',  appliedOn: '2026-06-01' },
];

const mockLeaveService = {
  getAll:     jest.fn().mockReturnValue(mockRequests),
  getBalance: jest.fn().mockReturnValue({ annual: 11, sick: 11, casual: 6 }),
  add:        jest.fn(),
};

describe('LeaveComponent', () => {
  let fixture: ComponentFixture<LeaveComponent>;
  let component: LeaveComponent;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockLeaveService.getAll.mockReturnValue(mockRequests);
    mockLeaveService.getBalance.mockReturnValue({ annual: 11, sick: 11, casual: 6 });

    await TestBed.configureTestingModule({
      imports: [LeaveComponent],
      providers: [{ provide: LeaveService, useValue: mockLeaveService }],
    }).compileComponents();

    fixture = TestBed.createComponent(LeaveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load requests and balance on init', () => {
    expect(component.requests.length).toBe(2);
    expect(component.balance.annual).toBe(11);
  });

  it('should calculate days correctly', () => {
    component.leaveForm.patchValue({ startDate: '2026-07-01', endDate: '2026-07-03' });
    expect(component.days).toBe(3);
  });

  it('should return 1 day when start equals end', () => {
    component.leaveForm.patchValue({ startDate: '2026-07-01', endDate: '2026-07-01' });
    expect(component.days).toBe(1);
  });

  it('should return 0 days when dates not set', () => {
    component.leaveForm.patchValue({ startDate: '', endDate: '' });
    expect(component.days).toBe(0);
  });

  it('should not submit when form is invalid', () => {
    component.leaveForm.patchValue({ reason: '' });
    component.submit();
    expect(mockLeaveService.add).not.toHaveBeenCalled();
  });

  it('should submit valid form and show success banner', () => {
    jest.useFakeTimers();
    component.leaveForm.patchValue({
      type: 'sick',
      startDate: '2026-07-10',
      endDate: '2026-07-10',
      reason: 'Feeling unwell with fever',
    });
    component.submit();
    expect(mockLeaveService.add).toHaveBeenCalledTimes(1);
    expect(component.submitSuccess).toBe(true);
    jest.advanceTimersByTime(3000);
    expect(component.submitSuccess).toBe(false);
    jest.useRealTimers();
  });

  it('should validate reason minimum length', () => {
    component.leaveForm.patchValue({ reason: 'short' });
    expect(component.leaveForm.get('reason')?.valid).toBe(false);
  });

  it('should pass validation with reason >= 10 chars', () => {
    component.leaveForm.patchValue({
      type: 'annual',
      startDate: '2026-07-01',
      endDate: '2026-07-01',
      reason: 'Valid reason for leave',
    });
    expect(component.leaveForm.valid).toBe(true);
  });

  it('should reset form and hide form panel after submit', () => {
    component.showForm = true;
    component.leaveForm.patchValue({
      type: 'casual',
      startDate: '2026-07-05',
      endDate: '2026-07-05',
      reason: 'Personal errand work',
    });
    component.submit();
    expect(component.showForm).toBe(false);
  });
});