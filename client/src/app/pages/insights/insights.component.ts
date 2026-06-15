import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InsightsService } from '../../core/services/insights.service';
import { AttritionInsight, EngagementInsight } from '../../core/models/insight.model';

@Component({
  selector: 'app-insights',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './insights.component.html',
  styleUrls: ['./insights.component.scss'],
})
export class InsightsComponent implements OnInit {
  attritionData: AttritionInsight[] = [];
  engagementData: EngagementInsight[] = [];
  narrative = '';
  isGenerating = false;

  constructor(private insightsService: InsightsService) {}

  ngOnInit() {
    this.attritionData  = this.insightsService.getAttritionInsights();
    this.engagementData = this.insightsService.getEngagementInsights();
    this.narrative      = this.insightsService.getAiNarrative();
  }

  regenerate() {
    this.isGenerating = true;
    this.narrative = '';
    setTimeout(() => {
      this.narrative = this.insightsService.getAiNarrative();
      this.isGenerating = false;
    }, 1800);
  }

  trendIcon(trend: string): string {
    return { rising: '↑', stable: '→', declining: '↓' }[trend] ?? '→';
  }

  trendClass(trend: string): string {
    return { rising: 'rising', stable: 'stable', declining: 'declining' }[trend] ?? '';
  }
}