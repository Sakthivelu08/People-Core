import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { OnboardingTask } from '../models/onboarding.model';
import { ApiService } from '../../services/api.service';

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private api = inject(ApiService);

  addEmployee(employee: { name: string; email: string; join_date: string; job_title?: string; department?: string; role?: string }): Observable<any> {
    return this.api.registerEmployee({
      azure_oid: 'generate',
      name: employee.name,
      email: employee.email,
      job_title: employee.job_title || null,
      department: employee.department || null,
      role: employee.role || 'Employee',
      status: 'onboarding',
      join_date: employee.join_date
    });
  }

  getEmployeeList(): Observable<any[]> {
    return this.api.getEmployees();
  }

  getTasksForEmployee(employeeId?: string): Observable<OnboardingTask[]> {
    return this.api.getOnboardingTasks(employeeId).pipe(
      map((tasks: any[]) => tasks.map(t => this.mapTask(t)))
    );
  }

  toggleForEmployee(taskId: string): Observable<any> {
    return this.api.toggleOnboardingTask(taskId);
  }

  getTasks(): Observable<OnboardingTask[]> {
    return this.getTasksForEmployee();
  }

  toggle(taskId: string): Observable<any> {
    return this.toggleForEmployee(taskId);
  }

  getProgress(tasks: OnboardingTask[]): number {
    if (!tasks || !tasks.length) return 0;
    return Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100);
  }

  private mapTask(db: any): OnboardingTask {
    return {
      id: db.id,
      title: db.title,
      description: db.description,
      category: db.category,
      completed: !!db.completed,
      dueDate: db.due_date,
      completedDate: db.completed_date
    };
  }
}