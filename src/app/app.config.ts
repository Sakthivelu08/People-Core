import { ApplicationConfig, importProvidersFrom, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';

import {
  MsalModule,
  MSAL_INSTANCE,
  MSAL_GUARD_CONFIG,
  MSAL_INTERCEPTOR_CONFIG,
  MsalGuardConfiguration,
  MsalInterceptorConfiguration,
  MsalService
} from '@azure/msal-angular';

import {
  PublicClientApplication,
  InteractionType
} from '@azure/msal-browser';

import { msalConfig, loginRequest } from './auth/msal.config';

export function MSALInstanceFactory() {
  return new PublicClientApplication(msalConfig);
}

export function MSALGuardConfigFactory(): MsalGuardConfiguration {
  return {
    interactionType: InteractionType.Redirect,
    authRequest: loginRequest
  };
}

export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap: new Map([
      ['https://graph.microsoft.com/v1.0/me', ['User.Read']]
    ])
  };
}

// Initialize MSAL BEFORE Angular starts
export function initializeMsal(msalService: MsalService) {
  return () => msalService.instance.initialize();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideRouter(routes),

    importProvidersFrom(
      MsalModule.forRoot(
        MSALInstanceFactory(),
        MSALGuardConfigFactory(),
        MSALInterceptorConfigFactory()
      )
    ),

    {
      provide: APP_INITIALIZER,
      useFactory: initializeMsal,
      deps: [MsalService],
      multi: true
    }
  ]
};
