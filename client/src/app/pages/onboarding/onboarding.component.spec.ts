import { TestBed, ComponentFixture } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { OnboardingComponent } from './onboarding.component';
import { OnboardingService } from '../../core/services/onboarding.service';
import { OnboardingTask } from '../../core/models/onboarding.model';

describe('OnboardingComponent', () => {
  let fixture: ComponentFixture<OnboardingComponent>;
  let component: OnboardingComponent;
  let mockOnboardingService: any;

  const mockTasks: OnboardingTask[] = [
    { id: 't1', title: 'Upload ID', description: 'Gov ID', category: 'documents', dueDate: '2026-01-01', completed: true },
    { id: 't2', title: 'Complete Training', description: 'Security training', category: 'training', dueDate: '2020-01-01', completed: false }
  ];

  beforeEach(async () => {
    mockOnboardingService = {
      getTasks: jasmine.createSpy('getTasks').and.returnValue(of(mockTasks)),
      getProgress: jasmine.createSpy('getProgress').and.returnValue(50),
      toggle: jasmine.createSpy('toggle').and.returnValue(of({}))
    };

    spyOn(console, 'error');

    await TestBed.configureTestingModule({
      imports: [OnboardingComponent],
      providers: [{ provide: OnboardingService, useValue: mockOnboardingService }]
    }).compileComponents();

    fixture = TestBed.createComponent(OnboardingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load tasks', () => {
    expect(component).toBeTruthy();
    expect(component.tasks().length).toBe(2);
    expect(component.completedCount).toBe(1);
    expect(component.progress).toBe(50);
  });

  it('should handle load error gracefully', () => {
    mockOnboardingService.getTasks.and.returnValue(throwError(() => new Error('Load error')));
    component.load();
    expect(component.tasks().length).toBe(2);
  });

  it('should filter tasks by category', () => {
    const docs = component.getTasksByCategory('documents');
    expect(docs.length).toBe(1);
    expect(docs[0].id).toBe('t1');
  });

  it('should toggle task state and handle error', () => {
    component.toggle('t1');
    expect(mockOnboardingService.toggle).toHaveBeenCalledWith('t1');

    mockOnboardingService.toggle.and.returnValue(throwError(() => new Error('Toggle error')));
    component.toggle('t2');
    expect(mockOnboardingService.toggle).toHaveBeenCalledWith('t2');
  });

  it('should check if task is overdue correctly', () => {
    expect(component.isOverdue(mockTasks[0])).toBe(false); // completed
    expect(component.isOverdue(mockTasks[1])).toBe(true);  // uncompleted past date
  });

  it('should return correct category labels and icons', () => {
    expect(component.categoryLabel('documents')).toBe('Documents');
    expect(component.categoryLabel('orientation')).toBe('Orientation');
    expect(component.categoryLabel('setup')).toBe('Setup');
    expect(component.categoryLabel('training')).toBe('Training');

    expect(component.categoryIcon('documents')).toBe('description');
    expect(component.categoryIcon('orientation')).toBe('explore');
    expect(component.categoryIcon('setup')).toBe('settings');
    expect(component.categoryIcon('training')).toBe('school');
  });
});
