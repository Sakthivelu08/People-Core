import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { InsightsComponent } from './insights.component';
import { InsightsService } from '../../core/services/insights.service';

const mockInsightsService = {
  getAttritionInsights:  jest.fn().mockReturnValue([
    { name: 'Arjun Mehta', department: 'Sales', riskScore: 78, riskLevel: 'high', keyFactors: ['Short tenure'] },
  ]),
  getEngagementInsights: jest.fn().mockReturnValue([
    { department: 'Engineering', score: 84, trend: 'rising' },
  ]),
  getAiNarrative:        jest.fn().mockReturnValue('Mock AI narrative text here.'),
};

describe('InsightsComponent', () => {
  let fixture: ComponentFixture<InsightsComponent>;
  let component: InsightsComponent;

  beforeEach(async () => {
    jest.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [InsightsComponent],
      providers: [{ provide: InsightsService, useValue: mockInsightsService }],
    }).compileComponents();

    fixture = TestBed.createComponent(InsightsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load all insight data on init', () => {
    expect(component.attritionData.length).toBe(1);
    expect(component.engagementData.length).toBe(1);
    expect(component.narrative).toBe('Mock AI narrative text here.');
  });

  it('should regenerate narrative after delay', fakeAsync(() => {
    component.regenerate();
    expect(component.isGenerating).toBe(true);
    expect(component.narrative).toBe('');
    tick(1800);
    expect(component.isGenerating).toBe(false);
    expect(component.narrative).toBe('Mock AI narrative text here.');
  }));

  it('should return correct trend icon', () => {
    expect(component.trendIcon('rising')).toBe('↑');
    expect(component.trendIcon('stable')).toBe('→');
    expect(component.trendIcon('declining')).toBe('↓');
    expect(component.trendIcon('unknown')).toBe('→');
  });

  it('should return correct trend class', () => {
    expect(component.trendClass('rising')).toBe('rising');
    expect(component.trendClass('stable')).toBe('stable');
    expect(component.trendClass('declining')).toBe('declining');
    expect(component.trendClass('unknown')).toBe('');
  });
});
