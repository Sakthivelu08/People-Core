import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { SnackbarComponent } from '../../components/snackbar/snackbar.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, SnackbarComponent],
  template: `
    <div class="shell" [class.admin-theme]="isAdminMode">
      <app-sidebar></app-sidebar>
      <main class="shell-content">
        <router-outlet></router-outlet>
      </main>
      <app-snackbar></app-snackbar>
    </div>
  `,
  styles: [`
    .shell {
      display: flex;
      min-height: 100vh;
      background: #f8fafc;
    }
    .shell-content {
      margin-left: 240px;
      flex: 1;
      padding: 24px;
      min-height: 100vh;
      background-color: #f8fafc;
      box-sizing: border-box;
    }
  `]
})
export class ShellComponent {
  private router = inject(Router);

  get isAdminMode(): boolean {
    return this.router.url.startsWith('/admin');
  }
}