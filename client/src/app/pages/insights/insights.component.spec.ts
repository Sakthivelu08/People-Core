import { TestBed, ComponentFixture } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { InsightsComponent } from './insights.component';
import { InsightsService } from '../../core/services/insights.service';

import { ApiService } from '../../services/api.service';

describe('InsightsComponent', () => {
  let fixture: ComponentFixture<InsightsComponent>;
  let component: InsightsComponent;
  let mockInsightsService: any;
  let mockApiService: any;

  beforeEach(async () => {
    mockApiService = {
      getNarrativeSummary: jasmine.createSpy('getNarrativeSummary').and.returnValue(of({ narrative: 'Mock AI narrative text here.' })),
      getEmployees: jasmine.createSpy('getEmployees').and.returnValue(of([])),
      getLeaveRequests: jasmine.createSpy('getLeaveRequests').and.returnValue(of([])),
      getOnboardingTasks: jasmine.createSpy('getOnboardingTasks').and.returnValue(of([]))
    };

    mockInsightsService = {
      getAttritionInsights: jasmine.createSpy('getAttritionInsights').and.returnValue(of([
        { name: 'Arjun Mehta', department: 'Sales', riskScore: 78, riskLevel: 'high', keyFactors: ['Short tenure'] }
      ])),
      getEngagementInsights: jasmine.createSpy('getEngagementInsights').and.returnValue(of([
        { department: 'Engineering', score: 84, trend: 'rising' }
      ])),
      getAiNarrative: jasmine.createSpy('getAiNarrative').and.returnValue(of('Mock AI narrative text here.'))
    };

    spyOn(console, 'error');

    await TestBed.configureTestingModule({
      imports: [InsightsComponent],
      providers: [
        { provide: InsightsService, useValue: mockInsightsService },
        { provide: ApiService, useValue: mockApiService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(InsightsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load all insight data on init', () => {
    expect(component.attritionData().length).toBe(1);
    expect(component.engagementData().length).toBe(1);
    expect(component.narrative()).toBe('Mock AI narrative text here.');
  });

  it('should handle API errors during load', () => {
    mockInsightsService.getAttritionInsights.and.returnValue(throwError(() => new Error('Err')));
    mockInsightsService.getEngagementInsights.and.returnValue(throwError(() => new Error('Err')));
    mockInsightsService.getAiNarrative.and.returnValue(throwError(() => new Error('Err')));

    component.load();
    expect(component.isGenerating()).toBe(false);
  });

  it('should regenerate narrative and handle error', () => {
    component.regenerate();
    expect(component.narrative()).toBe('Mock AI narrative text here.');
    expect(component.isGenerating()).toBe(false);

    mockInsightsService.getAiNarrative.and.returnValue(throwError(() => new Error('Regenerate error')));
    component.regenerate();
    expect(component.isGenerating()).toBe(false);
  });

  it('should return correct trend icon', () => {
    expect(component.trendIcon('rising')).toBe('trending_up');
    expect(component.trendIcon('stable')).toBe('trending_flat');
    expect(component.trendIcon('declining')).toBe('trending_down');
    expect(component.trendIcon('unknown')).toBe('trending_flat');
  });

  it('should return correct trend class', () => {
    expect(component.trendClass('rising')).toBe('rising');
    expect(component.trendClass('stable')).toBe('stable');
    expect(component.trendClass('declining')).toBe('declining');
    expect(component.trendClass('unknown')).toBe('');
  });

  it('should change provider and fetch narrative', () => {
    component.changeProvider('ollama');
    expect(component.selectedProvider()).toBe('ollama');
    expect(mockApiService.getNarrativeSummary).toHaveBeenCalledWith('ollama');
  });

  it('should handle fetchNarrative error fallback', () => {
    mockApiService.getNarrativeSummary.and.returnValue(throwError(() => new Error('API Error')));
    component.fetchNarrative();
    expect(component.narrative()).toContain('Defaulting to cached insights');
    expect(component.isGenerating()).toBe(false);
  });

  it('should calculate simulated risk score and level correctly across branches', () => {
    component.overtimeHours.set(20);
    component.salaryRatio.set(0.5);
    component.remoteDays.set(0);
    component.projectLoad.set(5);
    expect(component.simulatedRiskLevel()).toBe('high');

    component.overtimeHours.set(8);
    component.salaryRatio.set(0.95);
    component.remoteDays.set(2);
    component.projectLoad.set(2);
    expect(component.simulatedRiskLevel()).toBe('medium');

    component.overtimeHours.set(0);
    component.salaryRatio.set(1.2);
    component.remoteDays.set(5);
    component.projectLoad.set(1);
    expect(component.simulatedRiskLevel()).toBe('low');
  });
});
