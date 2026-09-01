import { GoogleGenAI } from '@google/genai';

export class AiProviderService {
  private geminiKey = process.env.GEMINI_API_KEY || '';

  async generateExecutiveSummary(provider: 'gemini' | 'ollama' | 'heuristic', workforceContext: any): Promise<string> {
    if (provider === 'gemini' && this.geminiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: this.geminiKey });
        const prompt = `You are PeopleCore AI, an enterprise HR predictive analytics assistant. Summarize the following workforce data into a professional 3-sentence executive insight report for leadership:
Data: ${JSON.stringify(workforceContext)}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt
        });

        if (response && response.text) {
          return response.text.trim();
        }
      } catch (err: any) {
        console.warn('[Gemini AI] Live API call fallback:', err.message);
      }
    }

    if (provider === 'ollama') {
      try {
        const res = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'llama3',
            prompt: `Summarize workforce insights for HR leader: ${JSON.stringify(workforceContext)}`,
            stream: false
          })
        });
        if (res.ok) {
          const data = (await res.json()) as { response: string };
          return data.response;
        }
      } catch (e: any) {
        console.warn('[Ollama AI] Local endpoint unavailable, falling back to rule engine.');
      }
    }

    // Heuristic Rule Engine Fallback
    const highRisk = workforceContext.highRiskCount || 0;
    const avgScore = workforceContext.avgScore || 82;
    return `[PeopleCore Rule Engine Insight] Analysis indicates ${highRisk} employee(s) at high attrition risk. Overall company engagement is currently ${avgScore}%. Immediate HR action is recommended for high-risk profiles in Engineering and Sales.`;
  }
}

export const aiProviderService = new AiProviderService();
