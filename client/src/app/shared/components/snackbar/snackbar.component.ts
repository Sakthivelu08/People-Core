import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { SnackbarService, SnackbarAlert } from '../../../core/services/snackbar.service';

@Component({
  selector: 'app-snackbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './snackbar.component.html',
  styleUrls: ['./snackbar.component.scss']
})
export class SnackbarComponent implements OnInit, OnDestroy {
  alerts = signal<SnackbarAlert[]>([]);
  private subscription!: Subscription;

  private snackbarService = inject(SnackbarService);

  ngOnInit() {
    this.subscription = this.snackbarService.alerts$.subscribe(alert => {
      this.alerts.update(list => [...list, alert]);
      
      // Auto dismiss after 3000ms
      setTimeout(() => {
        this.dismiss(alert.id);
      }, 3000);
    });
  }

  dismiss(id: string) {
    this.alerts.update(list => list.filter(a => a.id !== id));
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
