import { LeaveService } from './leave.service';
import { LeaveRequest } from '../models/leave.model';

describe('LeaveService', () => {
  let service: LeaveService;

  beforeEach(() => {
    localStorage.clear();
    service = new LeaveService();
  });

  it('should seed data on first load', () => {
    const all = service.getAll();
    expect(all.length).toBeGreaterThan(0);
  });

  it('should return same data from localStorage on second call', () => {
    const first = service.getAll();
    const second = service.getAll();
    expect(first.length).toBe(second.length);
  });

  it('should add a new leave request with status pending', () => {
    const before = service.getAll().length;
    service.add({ type: 'sick', startDate: '2026-07-01', endDate: '2026-07-01', days: 1, reason: 'Feeling unwell today' });
    expect(service.getAll().length).toBe(before + 1);
    expect(service.getAll()[0].status).toBe('pending');
  });

  it('should prepend new request to top of list', () => {
    service.add({ type: 'casual', startDate: '2026-07-10', endDate: '2026-07-10', days: 1, reason: 'Personal errand work' });
    expect(service.getAll()[0].type).toBe('casual');
  });

  it('should calculate balance by subtracting approved leaves', () => {
    localStorage.clear();
    const requests: LeaveRequest[] = [
      { id: '1', type: 'annual', startDate: '', endDate: '', days: 3, reason: '', status: 'approved', appliedOn: '' },
      { id: '2', type: 'sick',   startDate: '', endDate: '', days: 2, reason: '', status: 'approved', appliedOn: '' },
      { id: '3', type: 'annual', startDate: '', endDate: '', days: 5, reason: '', status: 'pending',  appliedOn: '' },
    ];
    localStorage.setItem('pc_leave_requests', JSON.stringify(requests));
    const balance = service.getBalance();
    expect(balance.annual).toBe(11); // 14 - 3
    expect(balance.sick).toBe(10);   // 12 - 2
    expect(balance.casual).toBe(6);  // unchanged
  });

  it('should not deduct rejected leaves from balance', () => {
    localStorage.clear();
    const requests: LeaveRequest[] = [
      { id: '1', type: 'annual', startDate: '', endDate: '', days: 5, reason: '', status: 'rejected', appliedOn: '' },
    ];
    localStorage.setItem('pc_leave_requests', JSON.stringify(requests));
    expect(service.getBalance().annual).toBe(14);
  });
});