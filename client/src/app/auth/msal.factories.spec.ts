import { MSALInstanceFactory, MSALGuardConfigFactory, MSALInterceptorConfigFactory } from './msal.factories';
import { InteractionType } from '@azure/msal-browser';

describe('msal.factories Unit Tests', () => {
  it('should instantiate PublicClientApplication via MSALInstanceFactory', () => {
    const instance = MSALInstanceFactory();
    expect(instance).toBeDefined();
  });

  it('should return Guard configuration via MSALGuardConfigFactory', () => {
    const guardConfig = MSALGuardConfigFactory();
    expect(guardConfig.interactionType).toBe(InteractionType.Redirect);
    expect(guardConfig.authRequest).toBeDefined();
  });

  it('should return Interceptor configuration via MSALInterceptorConfigFactory', () => {
    const interceptorConfig = MSALInterceptorConfigFactory();
    expect(interceptorConfig.interactionType).toBe(InteractionType.Redirect);
    expect(interceptorConfig.protectedResourceMap).toBeDefined();
  });
});
