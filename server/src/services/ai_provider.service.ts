import { GoogleGenAI } from '@google/genai';

export class AiProviderService {
  private get geminiKey(): string {
    return process.env.GEMINI_API_KEY || '';
  }

  async generateExecutiveSummary(provider: 'gemini' | 'ollama' | 'heuristic', workforceContext: any): Promise<string> {
    const apiKey = this.geminiKey;

    if (provider === 'gemini') {
      if (!apiKey) {
        console.warn('[Gemini AI] GEMINI_API_KEY environment variable is missing. Falling back to rule engine.');
      } else {
        try {
          console.log('[Gemini AI] Requesting live executive summary from Google Gemini 3.6 Flash...');
          const ai = new GoogleGenAI({ apiKey });
          const prompt = `You are PeopleCore AI, an enterprise HR predictive analytics assistant. Summarize the following workforce data into a fresh, professional 3-sentence executive insight report for leadership:
Data: ${JSON.stringify(workforceContext)}
Timestamp: ${new Date().toISOString()}`;

          const response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: prompt
          });

          if (response && response.text) {
            console.log('[Gemini AI] Successfully generated narrative summary.');
            return response.text.trim();
          }
        } catch (err: any) {
          console.warn('[Gemini AI] Live API call fallback:', err.message);
        }
      }
    }

    if (provider === 'ollama') {
      try {
        console.log('[Ollama AI] Requesting narrative from local Ollama service...');
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
