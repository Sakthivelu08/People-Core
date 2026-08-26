import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule, DatePipe } from '@angular/common';
import { MsalService } from '@azure/msal-angular';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  profile = signal<any>(null);
  photoUrl = signal<string | null>(null);
  groups = signal<any[]>([]);
  roles = signal<string[]>([]);
  dbProfile = signal<any>(null);

  private http = inject(HttpClient);
  private msal = inject(MsalService);
  private api = inject(ApiService);

  async ngOnInit() {
    const account = this.msal.instance.getActiveAccount();
    if (!account) return;

    this.roles.set(account.idTokenClaims?.roles as string[] || []);

    this.fetchGraphProfile(account);
    this.fetchDbProfile();
  }

  get isAdmin(): boolean {
    return this.roles().includes('Admin') || (this.dbProfile() && this.dbProfile().role === 'Admin');
  }

  async fetchGraphProfile(account: any) {
    try {
      const result = await this.msal.instance.acquireTokenSilent({
        scopes: ['User.Read', 'Group.Read.All', 'Directory.Read.All'],
        account
      });

      const headers = { Authorization: `Bearer ${result.accessToken}` };

      this.http.get('https://graph.microsoft.com/v1.0/me', { headers })
        .subscribe((data: any) => {
          this.profile.set(data);
        });

      this.http.get('https://graph.microsoft.com/v1.0/me/photo/$value', { headers, responseType: 'blob' })
        .subscribe({
          next: (blob) => {
            this.photoUrl.set(URL.createObjectURL(blob));
          },
          error: () => this.photoUrl.set(null)
        });

      this.http.get('https://graph.microsoft.com/v1.0/me/memberOf', { headers })
        .subscribe((groupsData: any) => {
          this.groups.set(groupsData.value || []);
        });
    } catch (err) {
      console.error('Error fetching Graph API details:', err);
    }
  }

  fetchDbProfile() {
    this.api.getProfile().subscribe({
      next: (data) => {
        this.dbProfile.set(data);
      },
      error: (err) => console.error('Failed to load DB profile:', err)
    });
  }

  logout() {
    this.msal.logoutRedirect();
  }
}
