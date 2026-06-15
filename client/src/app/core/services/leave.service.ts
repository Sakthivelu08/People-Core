import { Injectable } from '@angular/core';
import { LeaveRequest, LeaveBalance } from '../models/leave.model';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'pc_leave_requests';

const DEFAULT_BALANCE: LeaveBalance = { annual: 14, sick: 12, casual: 6 };

@Injectable({ providedIn: 'root' })
export class LeaveService {

  getAll(): LeaveRequest[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : this.seedData();
  }

  add(req: Omit<LeaveRequest, 'id' | 'appliedOn' | 'status'>): LeaveRequest {
    const all = this.getAll();
    const newReq: LeaveRequest = {
      ...req,
      id: uuidv4(),
      appliedOn: new Date().toISOString().split('T')[0],
      status: 'pending',
    };
    all.unshift(newReq);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    return newReq;
  }

  getBalance(): LeaveBalance {
    const all = this.getAll();
    const balance = { ...DEFAULT_BALANCE };
    all
      .filter(r => r.status === 'approved')
      .forEach(r => {
        if (r.type in balance) {
          (balance as any)[r.type] -= r.days;
        }
      });
    return balance;
  }

  private seedData(): LeaveRequest[] {
    const seed: LeaveRequest[] = [
      {
        id: uuidv4(),
        type: 'annual',
        startDate: '2026-05-12',
        endDate: '2026-05-14',
        days: 3,
        reason: 'Family vacation',
        status: 'approved',
        appliedOn: '2026-05-01',
      },
      {
        id: uuidv4(),
        type: 'sick',
        startDate: '2026-06-02',
        endDate: '2026-06-02',
        days: 1,
        reason: 'Fever and cold',
        status: 'approved',
        appliedOn: '2026-06-02',
      },
      {
        id: uuidv4(),
        type: 'casual',
        startDate: '2026-06-20',
        endDate: '2026-06-20',
        days: 1,
        reason: 'Personal errand',
        status: 'pending',
        appliedOn: '2026-06-10',
      },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
}