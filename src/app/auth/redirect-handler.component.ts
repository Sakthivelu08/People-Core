import { Component } from "@angular/core";
import { MsalRedirectComponent } from "@azure/msal-angular";

@Component({
  selector: "app-redirect-handler",
  standalone: true,
  template: ""
})
export class RedirectHandlerComponent extends MsalRedirectComponent {}
