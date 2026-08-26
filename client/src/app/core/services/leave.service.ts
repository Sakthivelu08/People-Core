import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { LeaveRequest, LeaveBalance } from '../models/leave.model';
import { ApiService } from '../../services/api.service';

@Injectable({ providedIn: 'root' })
export class LeaveService {
  private api = inject(ApiService);

  getAll(): Observable<LeaveRequest[]> {
    return this.api.getLeaveRequests().pipe(
      map((reqs: any[]) => reqs.map(r => this.mapRequest(r)))
    );
  }

  add(req: Omit<LeaveRequest, 'id' | 'appliedOn' | 'status'>): Observable<any> {
    return this.api.submitLeaveRequest({
      type: req.type,
      start_date: req.startDate,
      end_date: req.endDate,
      days: req.days,
      reason: req.reason
    });
  }

  getBalance(): Observable<LeaveBalance> {
    return this.api.getLeaveBalances().pipe(
      map((bal: any) => this.mapBalance(bal))
    );
  }

  private mapRequest(db: any): LeaveRequest {
    return {
      id: db.id,
      type: db.type,
      startDate: db.start_date,
      endDate: db.end_date,
      days: db.days,
      reason: db.reason,
      appliedOn: db.applied_on,
      status: db.status
    };
  }

  private mapBalance(db: any): LeaveBalance {
    return {
      annual: (db.annual_total || 14) - (db.annual_used || 0),
      sick: (db.sick_total || 12) - (db.sick_used || 0),
      casual: (db.casual_total || 6) - (db.casual_used || 0)
    };
  }
}