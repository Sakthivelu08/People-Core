import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MsalService } from '@azure/msal-angular';
import { RoleService } from '../../../core/services/role.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
} 

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit {
  isAdmin = signal<boolean>(false);

  private msal = inject(MsalService);
  private roleService = inject(RoleService);
  private router = inject(Router);

  ngOnInit() {
    this.isAdmin.set(this.roleService.isAdmin());
  }

  get isAdminMode(): boolean {
    return this.router.url.startsWith('/admin');
  }

  get portalTitle(): string {
    return this.isAdminMode ? 'PeopleCore Admin' : 'PeopleCore Portal';
  }

  get navItems(): NavItem[] {
    if (this.isAdminMode) {
      return [
        { path: '/admin/dashboard',  label: 'HR Dashboard',      icon: 'dashboard'               },
        { path: '/admin/directory',  label: 'Directory',          icon: 'groups'                  },
        { path: '/admin/onboarding', label: 'Onboarding Mgmt',   icon: 'admin_panel_settings'    },
        { path: '/admin/insights',   label: 'AI Insights',       icon: 'auto_awesome'            },
        { path: '/admin/employees/add', label: 'Add Employee',    icon: 'person_add'              },
      ];
    } else {
      return [
        { path: '/employee/profile', label: 'My Profile',        icon: 'account_circle'          },
        { path: '/employee/directory', label: 'Directory',       icon: 'groups'                  },
        { path: '/employee/leave',   label: 'Leave Tracker',     icon: 'date_range'              },
        { path: '/employee/onboarding', label: 'My Onboarding',  icon: 'assignment'              },
      ];
    }
  }

  logout() {
    this.msal.logoutRedirect();
  }
}