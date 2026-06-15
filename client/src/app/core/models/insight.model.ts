export type RiskLevel = 'low' | 'medium' | 'high';
export type EngagementTrend = 'rising' | 'stable' | 'declining';

export interface AttritionInsight {
  name: string;
  department: string;
  riskScore: number;
  riskLevel: RiskLevel;
  keyFactors: string[];
}

export interface EngagementInsight {
  department: string;
  score: number;
  trend: EngagementTrend;
}