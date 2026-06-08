import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { MsalBroadcastService, MsalService } from '@azure/msal-angular';
import { InteractionStatus } from '@azure/msal-browser';
import { firstValueFrom, filter } from 'rxjs';

export const authGuard: CanActivateFn = async (route, state) => {
  const msal = inject(MsalService);
  const router = inject(Router);
  const msalBroadcast = inject(MsalBroadcastService);

  // Wait until MSAL finishes initialization and redirect handling
  await firstValueFrom(
    msalBroadcast.inProgress$.pipe(
      filter((status: InteractionStatus) => status === InteractionStatus.None)
    )
  );

  const account = msal.instance.getActiveAccount();
  const isLoggedIn = !!account;
  const url = state.url;

  // Not logged in → allow only /login
  if (!isLoggedIn) {
    if (url !== '/login') {
      router.navigate(['/login']);
      return false;
    }
    return true;
  }

  // Logged in → block /login
  if (isLoggedIn && url === '/login') {
    router.navigate(['/home']);
    return false;
  }

  return true;
};
