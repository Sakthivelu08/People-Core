import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  template: `
    <div class="shell">
      <app-sidebar></app-sidebar>
      <main class="shell-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .shell {
      display: flex;
      min-height: 100vh;
      background: #f1f5f9;
    }
    .shell-content {
      margin-left: 240px;
      flex: 1;
      padding: 32px;
      min-height: 100vh;
    }
  `]
})
export class ShellComponent {}