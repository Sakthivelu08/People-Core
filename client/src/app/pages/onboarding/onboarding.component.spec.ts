import { TestBed, ComponentFixture } from '@angular/core/testing';
import { OnboardingComponent } from './onboarding.component';
import { OnboardingService } from '../../core/services/onboarding.service';
import { OnboardingTask } from '../../core/models/onboarding.model';

const mockTasks: OnboardingTask[] = [
  { id: '1', title: 'Submit ID proof',        description: 'Upload ID', category: 'documents',   completed: true,  dueDate: '2026-06-05' },
  { id: '2', title: 'Complete HR induction',  description: 'Attend',    category: 'orientation', completed: true,  dueDate: '2026-06-07' },
  { id: '3', title: 'Security training',      description: 'Finish',    category: 'training',    completed: false, dueDate: '2026-06-20' },
  { id: '4', title: 'Set up laptop',          description: 'Configure', category: 'setup',       completed: false, dueDate: '2026-06-08' },
];

const mockOnboardingService = {
  getTasks:    jest.fn().mockReturnValue(mockTasks),
  toggle:      jest.fn(),
  getProgress: jest.fn().mockReturnValue(50),
};

describe('OnboardingComponent', () => {
  let fixture: ComponentFixture<OnboardingComponent>;
  let component: OnboardingComponent;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockOnboardingService.getTasks.mockReturnValue([...mockTasks]);

    await TestBed.configureTestingModule({
      imports: [OnboardingComponent],
      providers: [{ provide: OnboardingService, useValue: mockOnboardingService }],
    }).compileComponents();

    fixture = TestBed.createComponent(OnboardingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load tasks on init', () => {
    expect(component.tasks.length).toBe(4);
  });

  it('should return correct progress', () => {
    expect(component.progress).toBe(50);
  });

  it('should filter tasks by category', () => {
    const docs = component.getTasksByCategory('documents');
    expect(docs.every(t => t.category === 'documents')).toBe(true);
  });

  it('should toggle a task and reload tasks', () => {
    component.toggle('1');

    expect(mockOnboardingService.toggle).toHaveBeenCalledWith('1');
    expect(mockOnboardingService.getTasks).toHaveBeenCalled();
  });

  it('should return correct completed count', () => {
    expect(component.completedCount).toBe(2);
  });

  it('should return correct category label for each category', () => {
    expect(component.categoryLabel('documents')).toContain('Documents');
    expect(component.categoryLabel('orientation')).toContain('Orientation');
    expect(component.categoryLabel('setup')).toContain('Setup');
    expect(component.categoryLabel('training')).toContain('Training');
  });

  it('should detect overdue tasks', () => {
    const overdueTask: OnboardingTask = {
      id: '99', title: '', description: '', category: 'setup',
      completed: false, dueDate: '2020-01-01',
    };
    expect(component.isOverdue(overdueTask)).toBe(true);
  });

  it('should not mark completed task as overdue', () => {
    const task: OnboardingTask = {
      id: '99', title: '', description: '', category: 'setup',
      completed: true, dueDate: '2020-01-01',
    };
    expect(component.isOverdue(task)).toBe(false);
  });

  it('should not mark future incomplete task as overdue', () => {
    const task: OnboardingTask = {
      id: '100', title: '', description: '', category: 'setup',
      completed: false, dueDate: '2999-01-01',
    };
    expect(component.isOverdue(task)).toBe(false);
  });
});
