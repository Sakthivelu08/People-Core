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
      background: #f8fafc;
    }
    .shell-content {
      margin-left: 280px;
      flex: 1;
      padding: 40px;
      min-height: 100vh;
      background-color: #f8fafc;
      box-sizing: border-box;
    }
  `]
})
export class ShellComponent {}