import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="table-responsive-wrapper">
      <table class="reusable-table">
        <thead>
          <tr>
            @for (header of headers(); track header) {
              <th>{{ header }}</th>
            }
          </tr>
        </thead>
        <tbody>
          <ng-content></ng-content>
        </tbody>
      </table>
    </div>
  `,
  styleUrls: ['./table.component.scss']
})
export class TableComponent {
  headers = input<string[]>([]);
}
