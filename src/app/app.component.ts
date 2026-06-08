import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RedirectHandlerComponent } from './auth/redirect-handler.component';
import { MsalBroadcastService, MsalService } from '@azure/msal-angular';
import { EventType, InteractionStatus } from '@azure/msal-browser';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RedirectHandlerComponent],
  templateUrl: './app.component.html'
})
  
export class AppComponent implements OnInit {

  constructor(
    private msal: MsalService,
    private msalBroadcast: MsalBroadcastService
  ) {}

  ngOnInit() {

    // Set active account on login success
    this.msalBroadcast.msalSubject$
      .pipe(filter(msg => msg.eventType === EventType.LOGIN_SUCCESS))
      .subscribe(() => {
        const accounts = this.msal.instance.getAllAccounts();
        if (accounts.length > 0) {
          this.msal.instance.setActiveAccount(accounts[0]);
        }
      });

    // Restore active account on page reload
    this.msalBroadcast.inProgress$
      .pipe(filter(status => status === InteractionStatus.None))
      .subscribe(() => {
        if (!this.msal.instance.getActiveAccount()) {
          const accounts = this.msal.instance.getAllAccounts();
          if (accounts.length > 0) {
            this.msal.instance.setActiveAccount(accounts[0]);
          }
        }
      });
  }
}
