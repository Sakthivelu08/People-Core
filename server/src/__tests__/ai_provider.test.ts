import { aiProviderService } from '../services/ai_provider.service';

describe('AiProviderService Unit Tests', () => {
  it('generates heuristic fallback narrative', async () => {
    const summary = await aiProviderService.generateExecutiveSummary('heuristic', {
      highRiskCount: 2,
      avgScore: 85
    });

    expect(summary).toContain('[PeopleCore Rule Engine Insight]');
    expect(summary).toContain('2 employee(s) at high attrition risk');
  });

  it('handles fallback when gemini key or call fails', async () => {
    const summary = await aiProviderService.generateExecutiveSummary('gemini', {
      highRiskCount: 0
    });

    expect(summary).toBeDefined();
    expect(summary.length).toBeGreaterThan(10);
  });

  it('handles fallback when ollama call fails', async () => {
    const summary = await aiProviderService.generateExecutiveSummary('ollama', {
      highRiskCount: 1
    });

    expect(summary).toBeDefined();
    expect(summary).toContain('[PeopleCore Rule Engine Insight]');
  });
});
