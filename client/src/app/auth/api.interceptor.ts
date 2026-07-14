import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { from } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const msal = inject(MsalService);
  
  if (req.url.startsWith(environment.apiUrl)) {
    const account = msal.instance.getActiveAccount();
    if (!account) {
      return next(req);
    }

    const oid = account.idTokenClaims?.oid || account.localAccountId;
    let headers = req.headers;
    if (oid) {
      headers = headers.set('x-user-oid', oid);
    }

    // Attempt to silently acquire a token. If it fails (e.g. in local/test settings),
    // proceed with the x-user-oid header, which is sufficient when VALIDATE_AZURE_TOKEN is false.
    return from(
      msal.instance.acquireTokenSilent({
        scopes: ['User.Read'],
        account
      })
    ).pipe(
      switchMap((result) => {
        if (result && result.idToken) {
          headers = headers.set('Authorization', `Bearer ${result.idToken}`);
        }
        const authReq = req.clone({ headers });
        return next(authReq);
      }),
      catchError((error) => {
        console.warn('[ApiInterceptor] Silent token acquisition failed, proceeding with OID header:', error);
        const authReq = req.clone({ headers });
        return next(authReq);
      })
    );
  }
  
  return next(req);
};
