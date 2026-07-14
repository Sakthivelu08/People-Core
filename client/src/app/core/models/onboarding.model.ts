export type TaskCategory = 'documents' | 'training' | 'setup' | 'orientation';

export interface OnboardingTask {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  completed: boolean;
  dueDate: string;
  completedDate?: string;
}