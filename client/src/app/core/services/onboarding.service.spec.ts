import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { OnboardingService } from './onboarding.service';
import { ApiService } from '../../services/api.service';

describe('OnboardingService', () => {
  let service: OnboardingService;
  let mockApi: any;

  beforeEach(() => {
    mockApi = {
      registerEmployee: jasmine.createSpy('registerEmployee').and.returnValue(of({ id: 'new-emp' })),
      getEmployees: jasmine.createSpy('getEmployees').and.returnValue(of([{ id: '1', name: 'John Doe' }])),
      getOnboardingTasks: jasmine.createSpy('getOnboardingTasks').and.returnValue(of([
        { id: 't1', title: 'Task 1', description: 'Desc 1', category: 'documents', completed: 1, due_date: '2026-06-01' }
      ])),
      toggleOnboardingTask: jasmine.createSpy('toggleOnboardingTask').and.returnValue(of({}))
    };

    TestBed.configureTestingModule({
      providers: [
        OnboardingService,
        { provide: ApiService, useValue: mockApi }
      ]
    });

    service = TestBed.inject(OnboardingService);
  });

  it('should register employee with all optional parameters', (done) => {
    service.addEmployee({
      name: 'John',
      email: 'john@ex.com',
      join_date: '2026-06-01',
      job_title: 'Senior Dev',
      department: 'Engineering',
      role: 'Admin'
    }).subscribe(res => {
      expect(mockApi.registerEmployee).toHaveBeenCalledWith(jasmine.objectContaining({
        job_title: 'Senior Dev',
        department: 'Engineering',
        role: 'Admin'
      }));
      done();
    });
  });

  it('should return employee list', (done) => {
    service.getEmployeeList().subscribe(list => {
      expect(list.length).toBe(1);
      done();
    });
  });

  it('should fetch tasks for employee and calculate progress', (done) => {
    service.getTasksForEmployee('1').subscribe(tasks => {
      expect(tasks.length).toBe(1);
      expect(tasks[0].completed).toBe(true);
      expect(service.getProgress(tasks)).toBe(100);
      done();
    });
  });

  it('should fetch tasks with getTasks() wrapper', (done) => {
    service.getTasks().subscribe(tasks => {
      expect(tasks.length).toBe(1);
      done();
    });
  });

  it('should return 0 progress for empty task list or null tasks', () => {
    expect(service.getProgress([])).toBe(0);
    expect(service.getProgress(null as any)).toBe(0);
  });

  it('should toggle onboarding task via toggle and toggleForEmployee', (done) => {
    service.toggle('t1').subscribe(() => {
      expect(mockApi.toggleOnboardingTask).toHaveBeenCalledWith('t1');
      service.toggleForEmployee('t2').subscribe(() => {
        expect(mockApi.toggleOnboardingTask).toHaveBeenCalledWith('t2');
        done();
      });
    });
  });
});
