import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MsalBroadcastService, MsalService } from '@azure/msal-angular';
import { InteractionStatus } from '@azure/msal-browser';
import { of } from 'rxjs';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  const router = { navigate: jest.fn() };
  const msal = {
    instance: {
      getActiveAccount: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: MsalService, useValue: msal },
        {
          provide: MsalBroadcastService,
          useValue: { inProgress$: of(InteractionStatus.None) },
        },
      ],
    });
  });

  function runGuard(url: string) {
    return TestBed.runInInjectionContext(() =>
      authGuard({} as any, { url } as any)
    );
  }

  it('allows the login page when no account exists', async () => {
    msal.instance.getActiveAccount.mockReturnValue(null);

    await expect(runGuard('/login')).resolves.toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('redirects protected pages to login when no account exists', async () => {
    msal.instance.getActiveAccount.mockReturnValue(null);

    await expect(runGuard('/home')).resolves.toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('redirects logged-in users away from login', async () => {
    msal.instance.getActiveAccount.mockReturnValue({ username: 'user@test.com' });

    await expect(runGuard('/login')).resolves.toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('allows protected pages for logged-in users', async () => {
    msal.instance.getActiveAccount.mockReturnValue({ username: 'user@test.com' });

    await expect(runGuard('/home')).resolves.toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
