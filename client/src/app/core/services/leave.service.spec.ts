import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { LeaveService } from './leave.service';
import { ApiService } from '../../services/api.service';

describe('LeaveService', () => {
  let service: LeaveService;
  let mockApi: any;

  beforeEach(() => {
    mockApi = {
      getLeaveRequests: jasmine.createSpy('getLeaveRequests').and.returnValue(of([
        { id: '1', type: 'annual', start_date: '2026-06-01', end_date: '2026-06-03', days: 3, reason: 'Vacation', applied_on: '2026-05-20', status: 'Approved' }
      ])),
      getLeaveBalances: jasmine.createSpy('getLeaveBalances').and.returnValue(of({
        annual_total: 14, annual_used: 3, sick_total: 12, sick_used: 1, casual_total: 6, casual_used: 0
      })),
      submitLeaveRequest: jasmine.createSpy('submitLeaveRequest').and.returnValue(of({ id: '2' }))
    };

    TestBed.configureTestingModule({
      providers: [
        LeaveService,
        { provide: ApiService, useValue: mockApi }
      ]
    });

    service = TestBed.inject(LeaveService);
  });

  it('should return all mapped leave requests', (done) => {
    service.getAll().subscribe(reqs => {
      expect(reqs.length).toBe(1);
      expect(reqs[0].days).toBe(3);
      done();
    });
  });

  it('should submit a leave request', (done) => {
    service.add({ type: 'annual', startDate: '2026-06-01', endDate: '2026-06-03', days: 3, reason: 'Trip' }).subscribe(res => {
      expect(mockApi.submitLeaveRequest).toHaveBeenCalled();
      done();
    });
  });

  it('should calculate mapped leave balance and handle defaults', (done) => {
    service.getBalance().subscribe(bal => {
      expect(bal.annual).toBe(11);
      expect(bal.sick).toBe(11);
      expect(bal.casual).toBe(6);

      mockApi.getLeaveBalances.and.returnValue(of({}));
      service.getBalance().subscribe(defaultBal => {
        expect(defaultBal.annual).toBe(14);
        expect(defaultBal.sick).toBe(12);
        expect(defaultBal.casual).toBe(6);
        done();
      });
    });
  });
});