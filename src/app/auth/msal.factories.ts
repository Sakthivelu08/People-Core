import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig, loginRequest } from "./msal.config";
import { InteractionType } from "@azure/msal-browser";
import {
  MsalGuardConfiguration,
  MsalInterceptorConfiguration
} from "@azure/msal-angular";

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
      ["https://graph.microsoft.com/v1.0/me", ["User.Read"]]
    ])
  };
}
