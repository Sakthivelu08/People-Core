import { TestBed, ComponentFixture } from '@angular/core/testing';
import { OnboardingMgmtComponent } from './onboarding-mgmt.component';
import { OnboardingService } from '../../../core/services/onboarding.service';
import { OnboardingTask } from '../../../core/models/onboarding.model';

const mockTasks: OnboardingTask[] = [
  { id: 't1', title: 'Submit ID', description: '', category: 'documents', completed: false, dueDate: '' },
  { id: 't2', title: 'Induction', description: '', category: 'orientation', completed: true, dueDate: '' },
];

const mockOnboardingService = {
  getEmployeeList:        jest.fn().mockReturnValue([]),
  addEmployee:            jest.fn(),
  getTasksForEmployee:    jest.fn().mockReturnValue(mockTasks),
  toggleForEmployee:      jest.fn(),
  getProgress:            jest.fn().mockReturnValue(50),
};

describe('OnboardingMgmtComponent', () => {
  let fixture: ComponentFixture<OnboardingMgmtComponent>;
  let component: OnboardingMgmtComponent;

  beforeEach(async () => {
    jest.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [OnboardingMgmtComponent],
      providers: [{ provide: OnboardingService, useValue: mockOnboardingService }],
    }).compileComponents();

    fixture = TestBed.createComponent(OnboardingMgmtComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load employee list on init', () => {
    expect(mockOnboardingService.getEmployeeList).toHaveBeenCalled();
  });

  it('should select employee and load their tasks', () => {
    const emp = { id: 'e1', name: 'Arjun Mehta', startDate: '2026-06-01', storageKey: 'pc_onboarding_Arjun' };
    component.selectEmployee(emp);
    expect(component.selectedEmployee).toEqual(emp);
    expect(component.selectedTasks.length).toBe(2);
  });

  it('should toggle task for selected employee', () => {
    const emp = { id: 'e1', name: 'Arjun', startDate: '2026-06-01', storageKey: 'key1' };
    component.selectedEmployee = emp;
    component.toggleTask('t1');
    expect(mockOnboardingService.toggleForEmployee).toHaveBeenCalledWith('key1', 't1');
  });

  it('should not toggle if no employee selected', () => {
    component.selectedEmployee = null;
    component.toggleTask('t1');
    expect(mockOnboardingService.toggleForEmployee).not.toHaveBeenCalled();
  });

  it('should not add employee if form is invalid', () => {
    component.addEmployee();
    expect(mockOnboardingService.addEmployee).not.toHaveBeenCalled();
  });

  it('should add employee and reset form when valid', () => {
    component.addForm.patchValue({ name: 'Priya Rajan', startDate: '2026-06-01' });
    component.addEmployee();
    expect(mockOnboardingService.addEmployee).toHaveBeenCalledWith('Priya Rajan', '2026-06-01');
    expect(component.addForm.value.name).toBeFalsy();
    expect(component.showAddForm).toBe(false);
  });

  it('should return progress from service', () => {
    component.selectedTasks = mockTasks;
    expect(component.progress).toBe(50);
  });
});