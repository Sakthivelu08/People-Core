import { InsightsService } from './insights.service';

describe('InsightsService', () => {
  let service: InsightsService;

  beforeEach(() => {
    service = new InsightsService();
  });

  it('should return attrition insights array', () => {
    const data = service.getAttritionInsights();
    expect(data.length).toBeGreaterThan(0);
  });

  it('should have valid riskLevel values', () => {
    const valid = ['low', 'medium', 'high'];
    service.getAttritionInsights().forEach(i => {
      expect(valid).toContain(i.riskLevel);
    });
  });

  it('should have riskScore between 0 and 100', () => {
    service.getAttritionInsights().forEach(i => {
      expect(i.riskScore).toBeGreaterThanOrEqual(0);
      expect(i.riskScore).toBeLessThanOrEqual(100);
    });
  });

  it('should return engagement insights array', () => {
    const data = service.getEngagementInsights();
    expect(data.length).toBeGreaterThan(0);
  });

  it('should have valid trend values', () => {
    const valid = ['rising', 'stable', 'declining'];
    service.getEngagementInsights().forEach(e => {
      expect(valid).toContain(e.trend);
    });
  });

  it('should have engagement scores between 0 and 100', () => {
    service.getEngagementInsights().forEach(e => {
      expect(e.score).toBeGreaterThanOrEqual(0);
      expect(e.score).toBeLessThanOrEqual(100);
    });
  });

  it('should return a non-empty AI narrative string', () => {
    const narrative = service.getAiNarrative();
    expect(typeof narrative).toBe('string');
    expect(narrative.length).toBeGreaterThan(0);
  });
});