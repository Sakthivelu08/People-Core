import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AttritionInsight, EngagementInsight } from '../models/insight.model';
import { ApiService } from '../../services/api.service';

@Injectable({ providedIn: 'root' })
export class InsightsService {
  private api = inject(ApiService);

  getAttritionInsights(): Observable<AttritionInsight[]> {
    return this.api.getAttritionRisk().pipe(
      map((list: any[]) => list.map(item => ({
        name: item.name,
        department: item.department,
        riskScore: item.riskScore,
        riskLevel: item.riskLevel,
        keyFactors: item.keyFactors
      })))
    );
  }

  getEngagementInsights(): Observable<EngagementInsight[]> {
    return this.api.getEngagementScores().pipe(
      map((list: any[]) => list.map(item => ({
        department: item.department,
        score: item.score,
        trend: item.trend
      })))
    );
  }

  getAiNarrative(): Observable<string> {
    return this.api.getNarrativeSummary().pipe(
      map(res => res.narrative || '')
    );
  }
}