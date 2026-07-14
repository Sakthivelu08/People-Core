import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { OnboardingService } from '../../../core/services/onboarding.service';
import { OnboardingTask } from '../../../core/models/onboarding.model';

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
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './onboarding-mgmt.component.html',
  styleUrls: ['./onboarding-mgmt.component.scss'],
})
export class OnboardingMgmtComponent implements OnInit {
  employees: EmployeeEntry[] = [];
  selectedEmployee: EmployeeEntry | null = null;
  selectedTasks: OnboardingTask[] = [];
  showAddForm = false;

  addForm!: ReturnType<FormBuilder['group']>;

  constructor(private onboardingService: OnboardingService, private fb: FormBuilder) {}

  ngOnInit() {
    this.addForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      startDate: ['', Validators.required],
      jobTitle: [''],
      department: [''],
      role: ['Employee', Validators.required]
    });
    this.loadEmployees();
  }

  loadEmployees() {
    this.onboardingService.getEmployeeList().subscribe({
      next: (data: any[]) => {
        this.employees = data.map(e => ({
          id: e.id,
          name: e.name,
          startDate: e.join_date ? e.join_date.split('T')[0] : 'N/A',
          email: e.email,
          jobTitle: e.job_title,
          department: e.department,
          role: e.role
        }));
      },
      error: (err) => console.error('Failed to load employees:', err)
    });
  }

  selectEmployee(emp: EmployeeEntry) {
    this.selectedEmployee = emp;
    this.loadSelectedTasks();
  }

  loadSelectedTasks() {
    if (!this.selectedEmployee) return;
    this.onboardingService.getTasksForEmployee(this.selectedEmployee.id).subscribe({
      next: (tasks) => {
        this.selectedTasks = tasks;
      },
      error: (err) => console.error('Failed to load employee tasks:', err)
    });
  }

  toggleTask(taskId: string) {
    if (!this.selectedEmployee) return;
    this.onboardingService.toggleForEmployee(taskId).subscribe({
      next: () => {
        this.loadSelectedTasks();
      },
      error: (err) => console.error('Failed to toggle task:', err)
    });
  }

  get progress(): number {
    return this.onboardingService.getProgress(this.selectedTasks);
  }

  addEmployee() {
    if (this.addForm.invalid) return;
    const v = this.addForm.value;
    this.onboardingService.addEmployee({
      name: v.name!,
      email: v.email!,
      join_date: v.startDate!,
      job_title: v.jobTitle || undefined,
      department: v.department || undefined,
      role: v.role || undefined
    }).subscribe({
      next: () => {
        this.addForm.reset({ role: 'Employee' });
        this.showAddForm = false;
        this.loadEmployees();
      },
      error: (err) => console.error('Failed to register employee:', err)
    });
  }
}