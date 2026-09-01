import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { authGuard } from './auth.guard';
import { MsalService, MsalBroadcastService } from '@azure/msal-angular';
import { InteractionStatus } from '@azure/msal-browser';

describe('authGuard Unit Tests', () => {
  let mockMsal: any;
  let mockRouter: any;
  let mockBroadcast: any;

  beforeEach(() => {
    mockMsal = {
      instance: {
        getActiveAccount: jasmine.createSpy('getActiveAccount')
      }
    };
    mockRouter = {
      navigate: jasmine.createSpy('navigate')
    };
    mockBroadcast = {
      inProgress$: of(InteractionStatus.None)
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: MsalService, useValue: mockMsal },
        { provide: Router, useValue: mockRouter },
        { provide: MsalBroadcastService, useValue: mockBroadcast }
      ]
    });
  });

  it('redirects to /login when user is not logged in and accessing protected route', async () => {
    mockMsal.instance.getActiveAccount.and.returnValue(null);
    const result = await TestBed.runInInjectionContext(() => authGuard({} as any, { url: '/employee/profile' } as any));
    expect(result).toBe(false);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('allows access to /login when user is not logged in', async () => {
    mockMsal.instance.getActiveAccount.and.returnValue(null);
    const result = await TestBed.runInInjectionContext(() => authGuard({} as any, { url: '/login' } as any));
    expect(result).toBe(true);
  });

  it('redirects to /employee/profile when logged in user accesses /login', async () => {
    mockMsal.instance.getActiveAccount.and.returnValue({ name: 'User' });
    const result = await TestBed.runInInjectionContext(() => authGuard({} as any, { url: '/login' } as any));
    expect(result).toBe(false);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/employee/profile']);
  });

  it('allows access to protected routes when logged in', async () => {
    mockMsal.instance.getActiveAccount.and.returnValue({ name: 'User' });
    const result = await TestBed.runInInjectionContext(() => authGuard({} as any, { url: '/employee/leave' } as any));
    expect(result).toBe(true);
  });
});
