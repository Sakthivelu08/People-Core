import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { InsightsService } from './insights.service';
import { ApiService } from '../../services/api.service';

describe('InsightsService', () => {
  let service: InsightsService;
  let mockApi: any;

  beforeEach(() => {
    mockApi = {
      getAttritionRisk: jasmine.createSpy('getAttritionRisk').and.returnValue(of([
        { name: 'Test User', department: 'Sales', riskScore: 80, riskLevel: 'high', keyFactors: [] }
      ])),
      getEngagementScores: jasmine.createSpy('getEngagementScores').and.returnValue(of([
        { department: 'Engineering', score: 85, trend: 'rising' }
      ])),
      getNarrativeSummary: jasmine.createSpy('getNarrativeSummary').and.returnValue(of({ narrative: 'Mock narrative' }))
    };

    TestBed.configureTestingModule({
      providers: [
        InsightsService,
        { provide: ApiService, useValue: mockApi }
      ]
    });

    service = TestBed.inject(InsightsService);
  });

  it('should return attrition insights', (done) => {
    service.getAttritionInsights().subscribe(data => {
      expect(data.length).toBe(1);
      expect(data[0].riskLevel).toBe('high');
      done();
    });
  });

  it('should return engagement insights', (done) => {
    service.getEngagementInsights().subscribe(data => {
      expect(data.length).toBe(1);
      expect(data[0].score).toBe(85);
      done();
    });
  });

  it('should return AI narrative summary and handle empty fallback', (done) => {
    service.getAiNarrative().subscribe(narrative => {
      expect(narrative).toBe('Mock narrative');
      
      mockApi.getNarrativeSummary.and.returnValue(of({}));
      service.getAiNarrative().subscribe(emptyNarrative => {
        expect(emptyNarrative).toBe('');
        done();
      });
    });
  });
});