import { Injectable, inject } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { ApiService } from '../../services/api.service';

export type AppRole = 'Admin' | 'Employee';

@Injectable({ providedIn: 'root' })
export class RoleService {
  private msal = inject(MsalService);
  private api = inject(ApiService);
  private dbProfileRole: string | null = null;

  constructor() {
    this.api.getProfile().subscribe({
      next: (profile) => {
        this.dbProfileRole = profile?.role || null;
      },
      error: () => {}
    });
  }

  getRoles(): string[] {
    const account = this.msal.instance.getActiveAccount();
    const tokenRoles = (account?.idTokenClaims?.roles as string[]) ?? [];
    if (this.dbProfileRole && !tokenRoles.includes(this.dbProfileRole)) {
      tokenRoles.push(this.dbProfileRole);
    }
    return tokenRoles;
  }

  isAdmin(): boolean {
    return this.getRoles().includes('Admin');
  }

  isEmployee(): boolean {
    return !this.isAdmin();
  }
}