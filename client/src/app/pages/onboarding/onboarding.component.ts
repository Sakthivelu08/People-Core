import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OnboardingService } from '../../core/services/onboarding.service';
import { OnboardingTask, TaskCategory } from '../../core/models/onboarding.model';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.scss'],
})
export class OnboardingComponent implements OnInit {
  tasks: OnboardingTask[] = [];
  categories: TaskCategory[] = ['documents', 'orientation', 'setup', 'training'];

  constructor(private onboardingService: OnboardingService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.onboardingService.getTasks().subscribe({
      next: (tasks) => this.tasks = tasks,
      error: (err) => console.error('Failed to get tasks:', err)
    });
  }

  get progress(): number {
    return this.onboardingService.getProgress(this.tasks);
  }

  getTasksByCategory(cat: TaskCategory): OnboardingTask[] {
    return this.tasks.filter(t => t.category === cat);
  }

  toggle(taskId: string) {
    this.onboardingService.toggle(taskId).subscribe({
      next: () => this.load(),
      error: (err) => console.error('Failed to toggle task:', err)
    });
  }
    
        get completedCount(): number {
    return this.tasks.filter(t => t.completed).length;
    }

    isOverdue(task: OnboardingTask): boolean {
    return !task.completed && new Date(task.dueDate) < new Date();
    }

  categoryLabel(cat: TaskCategory): string {
    const map: Record<TaskCategory, string> = {
      documents: 'Documents',
      orientation: 'Orientation',
      setup: 'Setup',
      training: 'Training',
    };
    return map[cat];
  }

  categoryIcon(cat: TaskCategory): string {
    const map: Record<TaskCategory, string> = {
      documents: 'description',
      orientation: 'explore',
      setup: 'settings',
      training: 'school',
    };
    return map[cat];
  }
}