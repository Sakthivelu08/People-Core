import { OnboardingService } from './onboarding.service';
import { OnboardingTask } from '../models/onboarding.model';

describe('OnboardingService', () => {
  let service: OnboardingService;

  beforeEach(() => {
    localStorage.clear();
    service = new OnboardingService();
  });

  it('should seed tasks on first load', () => {
    expect(service.getTasks().length).toBeGreaterThan(0);
  });

  it('should toggle task completed state', () => {
    const tasks = service.getTasks();
    const task = tasks[0];
    const initial = task.completed;
    service.toggle(task.id);
    expect(service.getTasks()[0].completed).toBe(!initial);
  });

  it('should toggle back to original on second toggle', () => {
    const tasks = service.getTasks();
    const task = tasks[0];
    const initial = task.completed;
    service.toggle(task.id);
    service.toggle(task.id);
    expect(service.getTasks()[0].completed).toBe(initial);
  });

  it('should leave tasks unchanged when toggling an unknown task', () => {
    const before = service.getTasks();
    service.toggle('missing-task');
    expect(service.getTasks()).toEqual(before);
  });

  it('should calculate 0% progress when no tasks completed', () => {
    const tasks: OnboardingTask[] = [
      { id: '1', title: '', description: '', category: 'documents', completed: false, dueDate: '' },
      { id: '2', title: '', description: '', category: 'training',  completed: false, dueDate: '' },
    ];
    expect(service.getProgress(tasks)).toBe(0);
  });

  it('should calculate 50% progress when half completed', () => {
    const tasks: OnboardingTask[] = [
      { id: '1', title: '', description: '', category: 'documents', completed: true,  dueDate: '' },
      { id: '2', title: '', description: '', category: 'training',  completed: false, dueDate: '' },
    ];
    expect(service.getProgress(tasks)).toBe(50);
  });

  it('should calculate 100% when all completed', () => {
    const tasks: OnboardingTask[] = [
      { id: '1', title: '', description: '', category: 'setup', completed: true, dueDate: '' },
    ];
    expect(service.getProgress(tasks)).toBe(100);
  });

  it('should return 0 for empty task list', () => {
    expect(service.getProgress([])).toBe(0);
  });

  it('should add employee and store in localStorage', () => {
    service.addEmployee('Arjun Mehta', '2026-06-01');
    const list = service.getEmployeeList();
    expect(list.length).toBe(1);
    expect(list[0].name).toBe('Arjun Mehta');
  });

  it('should seed tasks for newly added employee', () => {
    service.addEmployee('Priya Rajan', '2026-06-01');
    const emp = service.getEmployeeList()[0];
    const tasks = service.getTasksForEmployee(emp.storageKey);
    expect(tasks.length).toBeGreaterThan(0);
  });

  it('should toggle task for specific employee', () => {
    service.addEmployee('Test User', '2026-06-01');
    const emp = service.getEmployeeList()[0];
    const tasks = service.getTasksForEmployee(emp.storageKey);
    const initial = tasks[0].completed;
    service.toggleForEmployee(emp.storageKey, tasks[0].id);
    expect(service.getTasksForEmployee(emp.storageKey)[0].completed).toBe(!initial);
  });

  it('should leave employee tasks unchanged when toggling an unknown task', () => {
    service.addEmployee('Unknown Toggle', '2026-06-01');
    const emp = service.getEmployeeList()[0];
    const before = service.getTasksForEmployee(emp.storageKey);
    service.toggleForEmployee(emp.storageKey, 'missing-task');
    expect(service.getTasksForEmployee(emp.storageKey)).toEqual(before);
  });
});
