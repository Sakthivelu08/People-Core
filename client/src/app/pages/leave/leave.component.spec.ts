import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { LeaveComponent } from './leave.component';
import { LeaveService } from '../../core/services/leave.service';
import { SnackbarService } from '../../core/services/snackbar.service';

describe('LeaveComponent', () => {
  let fixture: ComponentFixture<LeaveComponent>;
  let component: LeaveComponent;
  let mockLeaveService: any;
  let mockSnackbar: any;

  beforeEach(async () => {
    mockLeaveService = {
      getAll: jasmine.createSpy('getAll').and.returnValue(of([
        { id: '1', type: 'annual', startDate: '2026-06-01', endDate: '2026-06-05', days: 5, reason: 'Vacation', appliedOn: '2026-05-20', status: 'approved' }
      ])),
      getBalance: jasmine.createSpy('getBalance').and.returnValue(of({
        annual: 15,
        sick: 10,
        casual: 5
      })),
      add: jasmine.createSpy('add').and.returnValue(of({}))
    };

    mockSnackbar = {
      success: jasmine.createSpy('success'),
      error: jasmine.createSpy('error')
    };

    spyOn(console, 'error');

    await TestBed.configureTestingModule({
      imports: [LeaveComponent, ReactiveFormsModule],
      providers: [
        { provide: LeaveService, useValue: mockLeaveService },
        { provide: SnackbarService, useValue: mockSnackbar }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LeaveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load leave data', () => {
    expect(component).toBeTruthy();
    expect(component.requests().length).toBe(1);
    expect(component.balance()?.annual).toBe(15);
  });

  it('should handle getAll and getBalance API errors', () => {
    mockLeaveService.getAll.and.returnValue(throwError(() => new Error('Error getAll')));
    mockLeaveService.getBalance.and.returnValue(throwError(() => new Error('Error getBalance')));

    component.load();
    expect(mockSnackbar.error).toHaveBeenCalledWith('Failed to load leave history.');
  });

  it('should calculate days correctly', () => {
    expect(component.days).toBe(0);

    component.leaveForm.patchValue({
      startDate: '2026-06-01',
      endDate: '2026-06-05'
    });
    expect(component.days).toBe(5);
  });

  it('should return early on submit if form is invalid', () => {
    component.submit();
    expect(mockLeaveService.add).not.toHaveBeenCalled();
  });

  it('should submit valid leave request successfully', () => {
    component.leaveForm.patchValue({
      type: 'annual',
      startDate: '2026-06-01',
      endDate: '2026-06-05',
      reason: 'Long vacation trip'
    });

    component.submit();
    expect(mockLeaveService.add).toHaveBeenCalledWith({
      type: 'annual',
      startDate: '2026-06-01',
      endDate: '2026-06-05',
      days: 5,
      reason: 'Long vacation trip'
    });
    expect(mockSnackbar.success).toHaveBeenCalledWith('Leave request submitted successfully!');
    expect(component.showForm()).toBe(false);
  });

  it('should handle leave submit error', () => {
    mockLeaveService.add.and.returnValue(throwError(() => new Error('Submit error')));

    component.leaveForm.patchValue({
      type: 'annual',
      startDate: '2026-06-01',
      endDate: '2026-06-05',
      reason: 'Long vacation trip'
    });

    component.submit();
    expect(mockSnackbar.error).toHaveBeenCalledWith('Failed to submit leave request.');
  });
});