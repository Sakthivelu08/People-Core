import { Component, Inject } from '@angular/core';
import {
  MsalService,
  MSAL_GUARD_CONFIG,
  MsalGuardConfiguration
} from '@azure/msal-angular';
import { RedirectRequest } from '@azure/msal-browser';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  constructor(
    private msal: MsalService,
    private router: Router,
    @Inject(MSAL_GUARD_CONFIG) private guardConfig: MsalGuardConfiguration
  ) {
    const account = this.msal.instance.getActiveAccount();
    if (account) {
      this.router.navigate(['/home']);
    }
  }

  login() {
    this.msal.loginRedirect(
      this.guardConfig.authRequest as RedirectRequest
    );
  }
}
