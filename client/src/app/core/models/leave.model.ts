export type LeaveType = 'annual' | 'sick' | 'casual';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveBalance {
  annual: number;
  sick: number;
  casual: number;
}

export interface LeaveRequest {
  id: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  appliedOn: string;
}