import { Injectable } from '@angular/core';
import { OnboardingTask } from '../models/onboarding.model';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'pc_onboarding_tasks';

@Injectable({ providedIn: 'root' })
export class OnboardingService {

    addEmployee(name: string, startDate: string): void {
  const key = `pc_onboarding_${name.replace(/\s/g, '_')}`;
  const tasks = this.seedTasksFor(key);
  const employees = this.getEmployeeList();
  employees.push({ id: uuidv4(), name, startDate, storageKey: key });
  localStorage.setItem('pc_onboarding_employees', JSON.stringify(employees));
}

getEmployeeList(): { id: string; name: string; startDate: string; storageKey: string }[] {
  const raw = localStorage.getItem('pc_onboarding_employees');
  return raw ? JSON.parse(raw) : [];
}

getTasksForEmployee(storageKey: string): OnboardingTask[] {
  const raw = localStorage.getItem(storageKey);
  return raw ? JSON.parse(raw) : [];
}

toggleForEmployee(storageKey: string, taskId: string): void {
  const tasks = this.getTasksForEmployee(storageKey);
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    task.completed = !task.completed;
    localStorage.setItem(storageKey, JSON.stringify(tasks));
  }
}

private seedTasksFor(key: string): OnboardingTask[] {
  const tasks: OnboardingTask[] = [
    { id: uuidv4(), title: 'Submit ID proof', description: 'Upload Aadhaar or Passport copy', category: 'documents', completed: false, dueDate: '' },
    { id: uuidv4(), title: 'Sign offer letter', description: 'Digitally sign and return', category: 'documents', completed: false, dueDate: '' },
    { id: uuidv4(), title: 'Complete HR induction', description: 'Attend the 2-hour HR orientation session', category: 'orientation', completed: false, dueDate: '' },
    { id: uuidv4(), title: 'Set up laptop & email', description: 'Configure work email and install required tools', category: 'setup', completed: false, dueDate: '' },
    { id: uuidv4(), title: 'Complete security training', description: 'Finish the mandatory cybersecurity course', category: 'training', completed: false, dueDate: '' },
  ];
  localStorage.setItem(key, JSON.stringify(tasks));
  return tasks;
}

  getTasks(): OnboardingTask[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : this.seedData();
  }

  toggle(taskId: string): void {
    const tasks = this.getTasks();
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }
  }

  getProgress(tasks: OnboardingTask[]): number {
    if (!tasks.length) return 0;
    return Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100);
  }

  private seedData(): OnboardingTask[] {
    const seed: OnboardingTask[] = [
      { id: uuidv4(), title: 'Submit ID proof', description: 'Upload Aadhaar or Passport copy', category: 'documents', completed: true, dueDate: '2026-06-05' },
      { id: uuidv4(), title: 'Sign offer letter', description: 'Digitally sign and return', category: 'documents', completed: true, dueDate: '2026-06-05' },
      { id: uuidv4(), title: 'Complete HR induction', description: 'Attend the 2-hour HR orientation session', category: 'orientation', completed: true, dueDate: '2026-06-07' },
      { id: uuidv4(), title: 'Set up laptop & email', description: 'Configure work email and install required tools', category: 'setup', completed: true, dueDate: '2026-06-08' },
      { id: uuidv4(), title: 'Complete security training', description: 'Finish the mandatory cybersecurity course on LMS', category: 'training', completed: false, dueDate: '2026-06-20' },
      { id: uuidv4(), title: 'Meet your team', description: 'Introductory 1:1 with each team member', category: 'orientation', completed: false, dueDate: '2026-06-15' },
      { id: uuidv4(), title: 'Complete Angular basics course', description: 'Finish the internal Angular training module', category: 'training', completed: false, dueDate: '2026-06-25' },
      { id: uuidv4(), title: 'Set up Azure DevOps access', description: 'Request and verify access to project boards', category: 'setup', completed: false, dueDate: '2026-06-18' },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
}