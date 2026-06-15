import { Injectable } from '@angular/core';
import { MsalService } from '@azure/msal-angular';

export type AppRole = 'Admin' | 'Employee';

@Injectable({ providedIn: 'root' })
export class RoleService {
  constructor(private msal: MsalService) {}

  getRoles(): string[] {
    const account = this.msal.instance.getActiveAccount();
    return (account?.idTokenClaims?.roles as string[]) ?? [];
  }

  isAdmin(): boolean {
    return this.getRoles().includes('Admin');
  }

  isEmployee(): boolean {
    return !this.isAdmin();
  }
}