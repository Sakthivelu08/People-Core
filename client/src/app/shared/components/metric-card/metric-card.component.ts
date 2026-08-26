import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-metric-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './metric-card.component.html',
  styleUrls: ['./metric-card.component.scss']
})
export class MetricCardComponent {
  label = input<string>('');
  value = input<string | number>('');
  icon = input<string>('');
  variant = input<string>(''); // e.g. 'primary', 'success', 'warning', 'danger'
  subtext = input<string>('');
}
