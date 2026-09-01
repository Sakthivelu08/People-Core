import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { OnboardingMgmtComponent } from './onboarding-mgmt.component';
import { OnboardingService } from '../../../core/services/onboarding.service';

describe('OnboardingMgmtComponent', () => {
  let fixture: ComponentFixture<OnboardingMgmtComponent>;
  let component: OnboardingMgmtComponent;
  let mockOnboardingService: any;

  beforeEach(async () => {
    mockOnboardingService = {
      getEmployeeList: jasmine.createSpy('getEmployeeList').and.returnValue(of([
        { id: 'emp-1', name: 'Aarav Sharma', join_date: '2026-01-15T00:00:00Z', email: 'aarav@ex.com', job_title: 'Engineer', department: 'IT', role: 'Employee' },
        { id: 'emp-2', name: 'No Date User', email: 'nodate@ex.com' }
      ])),
      getTasksForEmployee: jasmine.createSpy('getTasksForEmployee').and.returnValue(of([
        { id: 't1', title: 'Task 1', completed: true }
      ])),
      toggleForEmployee: jasmine.createSpy('toggleForEmployee').and.returnValue(of({})),
      getProgress: jasmine.createSpy('getProgress').and.returnValue(100)
    };

    await TestBed.configureTestingModule({
      imports: [OnboardingMgmtComponent],
      providers: [
        provideRouter([]),
        { provide: OnboardingService, useValue: mockOnboardingService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OnboardingMgmtComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load employee list with formatted join_date', () => {
    expect(component).toBeTruthy();
    expect(component.employees().length).toBe(2);
    expect(component.employees()[0].startDate).toBe('2026-01-15');
    expect(component.employees()[1].startDate).toBe('N/A');
  });

  it('should handle getEmployeeList error', () => {
    mockOnboardingService.getEmployeeList.and.returnValue(throwError(() => new Error('API Error')));
    component.loadEmployees();
    expect(component.employees().length).toBe(2);
  });

  it('should select employee and load tasks', () => {
    const emp = component.employees()[0];
    component.selectEmployee(emp);
    expect(component.selectedEmployee()).toEqual(emp);
    expect(mockOnboardingService.getTasksForEmployee).toHaveBeenCalledWith('emp-1');
    expect(component.selectedTasks().length).toBe(1);
    expect(component.progress).toBe(100);
  });

  it('should return early on loadSelectedTasks and toggleTask when no employee selected', () => {
    component.selectedEmployee.set(null);
    component.loadSelectedTasks();
    expect(mockOnboardingService.getTasksForEmployee).not.toHaveBeenCalledWith(null);

    component.toggleTask('t1');
    expect(mockOnboardingService.toggleForEmployee).not.toHaveBeenCalled();
  });

  it('should handle loadSelectedTasks and toggleTask API errors', () => {
    const emp = component.employees()[0];
    component.selectedEmployee.set(emp);

    mockOnboardingService.getTasksForEmployee.and.returnValue(throwError(() => new Error('Task load error')));
    component.loadSelectedTasks();

    mockOnboardingService.toggleForEmployee.and.returnValue(throwError(() => new Error('Toggle error')));
    component.toggleTask('t1');
    expect(mockOnboardingService.toggleForEmployee).toHaveBeenCalledWith('t1');
  });
});