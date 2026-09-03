import { TestBed, ComponentFixture } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PowerbiDashboardComponent } from './powerbi-dashboard.component';
import { ApiService } from '../../../services/api.service';
import { InsightsService } from '../../../core/services/insights.service';

describe('PowerbiDashboardComponent Unit Tests', () => {
  let fixture: ComponentFixture<PowerbiDashboardComponent>;
  let component: PowerbiDashboardComponent;
  let mockApiService: any;
  let mockInsightsService: any;

  const mockEmployees = [
    { id: 'e1', name: 'Alice', department: 'Engineering' },
    { id: 'e2', name: 'Bob', department: 'Support' }
  ];

  const mockInsights = [
    { employee_id: 'e1', department: 'Engineering', riskLevel: 'low', riskScore: 20 },
    { employee_id: 'e2', department: 'Support', riskLevel: 'high', riskScore: 85 }
  ];

  const mockLeaves = [
    { employee_id: 'e1', type: 'annual', days: 5 },
    { employee_id: 'e2', type: 'sick', days: 2 },
    { employee_id: 'e2', type: 'casual', days: 1 }
  ];

  const mockTasks = [
    { employee_id: 'e1', completed: true },
    { employee_id: 'e2', completed: false }
  ];

  beforeEach(async () => {
    mockApiService = {
      getEmployees: jasmine.createSpy('getEmployees').and.returnValue(of(mockEmployees)),
      getLeaveRequests: jasmine.createSpy('getLeaveRequests').and.returnValue(of(mockLeaves)),
      getOnboardingTasks: jasmine.createSpy('getOnboardingTasks').and.returnValue(of(mockTasks))
    };

    mockInsightsService = {
      getAttritionInsights: jasmine.createSpy('getAttritionInsights').and.returnValue(of(mockInsights))
    };

    spyOn(console, 'error');

    await TestBed.configureTestingModule({
      imports: [PowerbiDashboardComponent],
      providers: [
        { provide: ApiService, useValue: mockApiService },
        { provide: InsightsService, useValue: mockInsightsService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PowerbiDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load all analytics data on init', () => {
    expect(component).toBeTruthy();
    expect(component.isLoading).toBe(false);
    expect(component.summaryMetrics.totalEmployees).toBe(2);
    expect(component.summaryMetrics.highRiskCount).toBe(1);
    expect(component.summaryMetrics.onboardingCompletionRate).toBe(50);
  });

  it('should handle API errors during loadAllLiveAnalyticsData', () => {
    mockApiService.getEmployees.and.returnValue(throwError(() => new Error('API Error')));
    component.loadAllLiveAnalyticsData();
    expect(component.isLoading).toBe(false);
  });

  it('should filter analytics data by department', () => {
    component.setFilter('Engineering');
    expect(component.selectedFilter).toBe('Engineering');
    expect(component.summaryMetrics.totalEmployees).toBe(1);

    component.setFilter('Support');
    expect(component.summaryMetrics.totalEmployees).toBe(1);
    expect(component.summaryMetrics.highRiskCount).toBe(1);

    component.setFilter('all');
    expect(component.summaryMetrics.totalEmployees).toBe(2);
  });

  it('should calculate fallback metrics when dataset is empty', () => {
    mockApiService.getEmployees.and.returnValue(of([]));
    mockApiService.getLeaveRequests.and.returnValue(of([]));
    mockApiService.getOnboardingTasks.and.returnValue(of([]));
    mockInsightsService.getAttritionInsights.and.returnValue(of([]));

    component.loadAllLiveAnalyticsData();

    expect(component.summaryMetrics.totalEmployees).toBe(0);
    expect(component.summaryMetrics.avgLeaveDays).toBe(0);
    expect(component.summaryMetrics.onboardingCompletionRate).toBe(0);
    expect(component.departmentDistribution.length).toBe(2);
  });
});
