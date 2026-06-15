import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { OnboardingService } from '../../../core/services/onboarding.service';
import { OnboardingTask } from '../../../core/models/onboarding.model';

interface EmployeeEntry {
  id: string;
  name: string;
  startDate: string;
  storageKey: string;
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
      name:      ['', Validators.required],
      startDate: ['', Validators.required],
    });
    this.loadEmployees();
  }

  loadEmployees() {
    this.employees = this.onboardingService.getEmployeeList();
  }

  selectEmployee(emp: EmployeeEntry) {
    this.selectedEmployee = emp;
    this.selectedTasks = this.onboardingService.getTasksForEmployee(emp.storageKey);
  }

  toggleTask(taskId: string) {
    if (!this.selectedEmployee) return;
    this.onboardingService.toggleForEmployee(this.selectedEmployee.storageKey, taskId);
    this.selectedTasks = this.onboardingService.getTasksForEmployee(this.selectedEmployee.storageKey);
  }

  get progress(): number {
    return this.onboardingService.getProgress(this.selectedTasks);
  }

  addEmployee() {
    if (this.addForm.invalid) return;
    const { name, startDate } = this.addForm.value;
    this.onboardingService.addEmployee(name, startDate);
    this.addForm.reset();
    this.showAddForm = false;
    this.loadEmployees();
  }
}