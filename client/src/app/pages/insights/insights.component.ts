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
    this.load();
  }

  load() {
    this.insightsService.getAttritionInsights().subscribe({
      next: (data) => this.attritionData = data,
      error: (err) => console.error('Failed to get attrition risk:', err)
    });
    this.insightsService.getEngagementInsights().subscribe({
      next: (data) => this.engagementData = data,
      error: (err) => console.error('Failed to get engagement:', err)
    });
    this.insightsService.getAiNarrative().subscribe({
      next: (data) => this.narrative = data,
      error: (err) => console.error('Failed to get narrative:', err)
    });
  }

  regenerate() {
    this.isGenerating = true;
    this.narrative = '';
    this.insightsService.getAiNarrative().subscribe({
      next: (data) => {
        this.narrative = data;
        this.isGenerating = false;
      },
      error: (err) => {
        console.error('Failed to regenerate narrative:', err);
        this.isGenerating = false;
      }
    });
  }

  trendIcon(trend: string): string {
    return { rising: 'trending_up', stable: 'trending_flat', declining: 'trending_down' }[trend] ?? 'trending_flat';
  }

  trendClass(trend: string): string {
    return { rising: 'rising', stable: 'stable', declining: 'declining' }[trend] ?? '';
  }
}