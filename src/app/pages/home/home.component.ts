import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MsalService } from '@azure/msal-angular';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  profile: any;
  photoUrl: string | null = null;
  groups: any[] = [];
  roles: any[] = [];

  constructor(private http: HttpClient, private msal: MsalService) {}

  async ngOnInit() {
    const account = this.msal.instance.getActiveAccount();

    if (!account) return;

    // Update Roles
    this.roles = account.idTokenClaims?.roles as string[] || [];

    // Acquire Graph API token
    const result = await this.msal.instance.acquireTokenSilent({
      scopes: [
        'User.Read',
        'Group.Read.All',
        'Directory.Read.All'
      ],
      account
    });

    const headers = {
      Authorization: `Bearer ${result.accessToken}`
    };

    // Fetch user basic profile
    this.http.get('https://graph.microsoft.com/v1.0/me', { headers })
      .subscribe((data: any) => {
        console.log("MS Graph /me response:", data);
        this.profile = data;
      });

    // Fetch profile photo
    this.http.get('https://graph.microsoft.com/v1.0/me/photo/$value', {
      headers,
      responseType: 'blob'
    })
    .subscribe({
      next: (blob) => {
        this.photoUrl = URL.createObjectURL(blob);
      },
      error: () => (this.photoUrl = null)
    });

    // Fetch user groups & directory roles
    this.http.get("https://graph.microsoft.com/v1.0/me/memberOf", { headers })
      .subscribe((groups: any) => {
        console.log("Groups & Roles:", groups.value);
        this.groups = groups.value;
      });
  }

  logout() {
    this.msal.logoutRedirect();
  }
}
