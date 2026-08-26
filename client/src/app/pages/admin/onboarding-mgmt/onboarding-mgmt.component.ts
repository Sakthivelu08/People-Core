import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OnboardingService } from '../../../core/services/onboarding.service';
import { OnboardingTask } from '../../../core/models/onboarding.model';
import { BeautifulDatePipe } from '../../../shared/pipes/beautiful-date.pipe';

interface EmployeeEntry {
  id: string;
  name: string;
  startDate: string;
  email: string;
  jobTitle?: string;
  department?: string;
  role?: string;
}

@Component({
  selector: 'app-onboarding-mgmt',
  standalone: true,
  imports: [CommonModule, RouterLink, BeautifulDatePipe],
  templateUrl: './onboarding-mgmt.component.html',
  styleUrls: ['./onboarding-mgmt.component.scss'],
})
export class OnboardingMgmtComponent implements OnInit {
  employees = signal<EmployeeEntry[]>([]);
  selectedEmployee = signal<EmployeeEntry | null>(null);
  selectedTasks = signal<OnboardingTask[]>([]);

  private onboardingService = inject(OnboardingService);

  ngOnInit() {
    this.loadEmployees();
  }

  loadEmployees() {
    this.onboardingService.getEmployeeList().subscribe({
      next: (data: any[]) => {
        this.employees.set(data.map(e => ({
          id: e.id,
          name: e.name,
          startDate: e.join_date ? e.join_date.split('T')[0] : 'N/A',
          email: e.email,
          jobTitle: e.job_title,
          department: e.department,
          role: e.role
        })));
      },
      error: (err) => console.error('Failed to load employees:', err)
    });
  }

  selectEmployee(emp: EmployeeEntry) {
    this.selectedEmployee.set(emp);
    this.loadSelectedTasks();
  }

  loadSelectedTasks() {
    const emp = this.selectedEmployee();
    if (!emp) return;
    this.onboardingService.getTasksForEmployee(emp.id).subscribe({
      next: (tasks) => {
        this.selectedTasks.set(tasks);
      },
      error: (err) => console.error('Failed to load employee tasks:', err)
    });
  }

  toggleTask(taskId: string) {
    if (!this.selectedEmployee()) return;
    this.onboardingService.toggleForEmployee(taskId).subscribe({
      next: () => {
        this.loadSelectedTasks();
      },
      error: (err) => console.error('Failed to toggle task:', err)
    });
  }

  get progress(): number {
    return this.onboardingService.getProgress(this.selectedTasks());
  }
}