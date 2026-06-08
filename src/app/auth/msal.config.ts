import { BrowserCacheLocation, LogLevel } from "@azure/msal-browser";
import { environment } from "../../environments/environment";

export const msalConfig = {
  auth: {
    clientId: environment.azure.clientId,
    authority: `https://login.microsoftonline.com/${environment.azure.tenantId}`,
    redirectUri: environment.azure.redirectUri
  },
  cache: {
    cacheLocation: BrowserCacheLocation.LocalStorage,
    storeAuthStateInCookie: false
  },
  // To see detailed MSAL logs, uncomment this section
  // system: { 
  //   loggerOptions: {
  //     loggerCallback: (level: LogLevel, message: string) => {
  //       console.log("MSAL:", message);
  //     },
  //     logLevel: LogLevel.Verbose
  //   }
  // }
};

export const loginRequest = {
  scopes: [
    "User.Read",
    "Group.Read.All",
    "Directory.Read.All"
  ]
};
