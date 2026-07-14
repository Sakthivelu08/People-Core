export interface Employee {
  id: string;
  azure_oid: string;
  name: string;
  email: string;
  job_title: string | null;
  department: string | null;
  office_location: string | null;
  mobile_phone: string | null;
  role: 'Admin' | 'Employee';
  status: 'active' | 'onboarding' | 'inactive';
  join_date: string | null;
  created_at: Date;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  type: 'annual' | 'sick' | 'casual';
  start_date: string;
  end_date: string;
  days: number;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  applied_on: string;
  reviewed_by: string | null;
  reviewed_on: string | null;
}

export interface LeaveBalance {
  id: string;
  employee_id: string;
  annual_total: number;
  sick_total: number;
  casual_total: number;
  year: number;
}

export interface OnboardingTask {
  id: string;
  employee_id: string;
  title: string;
  description: string | null;
  category: 'documents' | 'training' | 'setup' | 'orientation';
  completed: boolean;
  due_date: string | null;
  completed_date: string | null;
  created_at: Date;
}

export interface AttritionScore {
  id: string;
  employee_id: string;
  risk_score: number | null;
  risk_level: 'low' | 'medium' | 'high' | null;
  key_factors: string | null;
  generated_at: Date;
}

export interface EngagementScore {
  id: string;
  department: string;
  score: number | null;
  trend: 'rising' | 'stable' | 'declining' | null;
  recorded_at: Date;
}

export interface AuthUser {
  id: string;
  azure_oid: string;
  name: string;
  email: string;
  role: 'Admin' | 'Employee';
  department: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
