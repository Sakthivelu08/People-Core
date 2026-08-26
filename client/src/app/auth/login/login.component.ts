import { Component, inject } from '@angular/core';
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
  private msal = inject(MsalService);
  private router = inject(Router);
  private guardConfig = inject<MsalGuardConfiguration>(MSAL_GUARD_CONFIG);

  constructor() {
    const account = this.msal.instance.getActiveAccount();
    if (account) {
      this.router.navigate(['/employee/profile']);
    }
  }

  login() {
    this.msal.loginRedirect(
      this.guardConfig.authRequest as RedirectRequest
    );
  }
}
