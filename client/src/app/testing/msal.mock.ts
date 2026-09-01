import { MSAL_GUARD_CONFIG, MsalBroadcastService, MsalService } from '@azure/msal-angular';
import { of, Subject } from 'rxjs';
import { InteractionStatus } from '@azure/msal-browser';

export const mockMsalInstance = {
  getActiveAccount: jasmine.createSpy('getActiveAccount').and.returnValue({
    idTokenClaims: { roles: ['Admin'] },
    name: 'Test Admin',
    username: 'admin@test.com'
  }),
  getAllAccounts: jasmine.createSpy('getAllAccounts').and.returnValue([{}]),
  setActiveAccount: jasmine.createSpy('setActiveAccount'),
  acquireTokenSilent: jasmine.createSpy('acquireTokenSilent').and.resolveTo({ accessToken: 'mock-token' }),
  initialize: jasmine.createSpy('initialize').and.resolveTo(undefined),
};

export const mockMsalService = {
  instance: mockMsalInstance,
  getLogger: jasmine.createSpy('getLogger').and.returnValue({
    verbose: jasmine.createSpy('verbose'),
    info: jasmine.createSpy('info'),
    warning: jasmine.createSpy('warning'),
    error: jasmine.createSpy('error'),
  }),
  handleRedirectObservable: jasmine.createSpy('handleRedirectObservable').and.returnValue(of(null)),
  loginRedirect: jasmine.createSpy('loginRedirect'),
  logoutRedirect: jasmine.createSpy('logoutRedirect'),
};

export const mockMsalBroadcastService = {
  msalSubject$: new Subject(),
  inProgress$: new Subject<InteractionStatus>(),
};

export function provideMsalMocks() {
  return [
    { provide: MsalService, useValue: mockMsalService },
    { provide: MsalBroadcastService, useValue: mockMsalBroadcastService },
    {
      provide: MSAL_GUARD_CONFIG,
      useValue: {
        authRequest: {
          scopes: ['user.read'],
        },
      },
    },
  ];
}
