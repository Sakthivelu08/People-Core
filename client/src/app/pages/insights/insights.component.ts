import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { InsightsService } from '../../core/services/insights.service';
import { AttritionInsight, EngagementInsight } from '../../core/models/insight.model';
import { DropdownComponent } from '../../shared/components/dropdown/dropdown.component';

import { PowerbiDashboardComponent } from './powerbi-dashboard/powerbi-dashboard.component';

@Component({
  selector: 'app-insights',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownComponent, PowerbiDashboardComponent],
  templateUrl: './insights.component.html',
  styleUrls: ['./insights.component.scss'],
})
export class InsightsComponent implements OnInit {
  activeTab = signal<'ai' | 'powerbi'>('ai');
  attritionData = signal<AttritionInsight[]>([]);
  engagementData = signal<EngagementInsight[]>([]);
  narrative = signal<string>('');
  isGenerating = signal<boolean>(false);

  selectedProvider = signal<'gemini' | 'ollama' | 'heuristic'>('gemini');

  providerOptions = [
    { value: 'gemini', label: 'Google Gemini AI (Cloud)' },
    { value: 'ollama', label: 'Ollama LLM (Local Privacy)' },
    { value: 'heuristic', label: 'Rule Engine (Offline)' }
  ];

  // Simulator Signals
  overtimeHours = signal<number>(12);
  salaryRatio = signal<number>(0.85);
  remoteDays = signal<number>(1);
  projectLoad = signal<number>(4);

  simulatedRiskScore = computed(() => {
    let base = 50;
    base += (this.overtimeHours() - 5) * 2.5;
    base += (1 - this.salaryRatio()) * 40;
    base -= this.remoteDays() * 4;
    base += (this.projectLoad() - 2) * 6;
    return Math.min(99, Math.max(15, Math.round(base)));
  });

  simulatedRiskLevel = computed(() => {
    const score = this.simulatedRiskScore();
    if (score >= 75) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  });

  private insightsService = inject(InsightsService);
  private api = inject(ApiService);

  ngOnInit() {
    this.load();
  }

  load() {
    this.insightsService.getAttritionInsights().subscribe({
      next: (data) => this.attritionData.set(data),
      error: (err) => console.error('Failed to get attrition risk:', err)
    });
    this.insightsService.getEngagementInsights().subscribe({
      next: (data) => this.engagementData.set(data),
      error: (err) => console.error('Failed to get engagement:', err)
    });
    this.fetchNarrative();
  }

  fetchNarrative() {
    this.isGenerating.set(true);
    this.api.getNarrativeSummary(this.selectedProvider()).subscribe({
      next: (res: any) => {
        this.narrative.set(res.narrative || res);
        this.isGenerating.set(false);
      },
      error: () => {
        this.narrative.set('Failed to generate narrative summary. Defaulting to cached insights.');
        this.isGenerating.set(false);
      }
    });
  }

  changeProvider(prov: 'gemini' | 'ollama' | 'heuristic') {
    this.selectedProvider.set(prov);
    this.fetchNarrative();
  }

  regenerate() {
    this.fetchNarrative();
  }

  trendIcon(trend: string): string {
    return { rising: 'trending_up', stable: 'trending_flat', declining: 'trending_down' }[trend] ?? 'trending_flat';
  }

  trendClass(trend: string): string {
    return { rising: 'rising', stable: 'stable', declining: 'declining' }[trend] ?? '';
  }
}