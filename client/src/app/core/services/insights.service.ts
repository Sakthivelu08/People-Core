import { Injectable } from '@angular/core';
import { AttritionInsight, EngagementInsight } from '../models/insight.model';

@Injectable({ providedIn: 'root' })
export class InsightsService {

  getAttritionInsights(): AttritionInsight[] {
    return [
      { name: 'Arjun Mehta', department: 'Sales', riskScore: 78, riskLevel: 'high', keyFactors: ['Short tenure', 'Low performance score', 'Missed 3 check-ins'] },
      { name: 'Divya Nair', department: 'Support', riskScore: 54, riskLevel: 'medium', keyFactors: ['No promotion in 2 years', 'Declining engagement score'] },
      { name: 'Sakthivelu Selvam', department: 'Engineering', riskScore: 18, riskLevel: 'low', keyFactors: ['Strong performance', 'Active on projects'] },
      { name: 'Priya Rajan', department: 'HR', riskScore: 12, riskLevel: 'low', keyFactors: ['High engagement', 'Recent recognition'] },
    ];
  }

  getEngagementInsights(): EngagementInsight[] {
    return [
      { department: 'Engineering', score: 84, trend: 'rising' },
      { department: 'HR', score: 91, trend: 'stable' },
      { department: 'Sales', score: 62, trend: 'declining' },
      { department: 'Support', score: 70, trend: 'stable' },
    ];
  }

  getAiNarrative(): string {
    return `Based on current workforce data, 1 employee (Arjun Mehta, Sales) is flagged 
as high attrition risk — primary signals are short tenure and below-average performance. 
The Sales department shows a declining engagement trend (62/100), which correlates 
with the attrition signal. Engineering remains the strongest department with rising 
engagement (84/100). Recommended immediate actions: schedule a 1:1 retention 
conversation with Arjun Mehta, and run a Sales team pulse survey this week.`;
  }
}