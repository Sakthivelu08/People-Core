import { MSAL_GUARD_CONFIG, MsalBroadcastService, MsalService } from '@azure/msal-angular';
import { of, Subject } from 'rxjs';
import { InteractionStatus } from '@azure/msal-browser';

export const mockMsalInstance = {
  getActiveAccount: jest.fn().mockReturnValue({
    idTokenClaims: { roles: ['Admin'] },
  }),
  getAllAccounts: jest.fn().mockReturnValue([{}]),
  setActiveAccount: jest.fn(),
  acquireTokenSilent: jest.fn().mockResolvedValue({ accessToken: 'mock-token' }),
  initialize: jest.fn().mockResolvedValue(undefined),
};

export const mockMsalService = {
  instance: mockMsalInstance,
  getLogger: jest.fn().mockReturnValue({
    verbose: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
  }),
  handleRedirectObservable: jest.fn().mockReturnValue(of(null)),
  loginRedirect: jest.fn(),
  logoutRedirect: jest.fn(),
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
