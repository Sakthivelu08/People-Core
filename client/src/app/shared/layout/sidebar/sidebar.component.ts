import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MsalService } from '@azure/msal-angular';
import { RoleService } from '../../../core/services/role.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit {
  isAdmin = false;

  allNavItems: NavItem[] = [
    { path: '/home',             label: 'My Profile',       icon: 'account_circle'  },
    { path: '/leave',            label: 'Leave Tracker',    icon: 'date_range'      },
    { path: '/onboarding',       label: 'My Onboarding',    icon: 'assignment'      },
    { path: '/admin/onboarding', label: 'Onboarding Mgmt',  icon: 'admin_panel_settings', adminOnly: true },
    { path: '/insights',         label: 'AI Insights',      icon: 'auto_awesome',         adminOnly: true },
  ];

  get navItems(): NavItem[] {
    return this.allNavItems.filter(i => !i.adminOnly || this.isAdmin);
    }
    
    get employeeNavItems() { return this.allNavItems.filter(i => !i.adminOnly); }
get adminNavItems()    { return this.allNavItems.filter(i => i.adminOnly); }

  constructor(private msal: MsalService, private roleService: RoleService) {}

  ngOnInit() {
    this.isAdmin = this.roleService.isAdmin();
  }

  logout() { this.msal.logoutRedirect(); }
}