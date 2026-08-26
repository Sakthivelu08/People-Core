import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface SnackbarAlert {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  icon: string;
}

@Injectable({
  providedIn: 'root'
})
export class SnackbarService {
  private alertSubject = new Subject<SnackbarAlert>();
  alerts$ = this.alertSubject.asObservable();

  private trigger(message: string, type: 'success' | 'error' | 'warning' | 'info', icon: string) {
    const id = Math.random().toString(36).substring(2, 9);
    this.alertSubject.next({ id, message, type, icon });
  }

  success(message: string) {
    this.trigger(message, 'success', 'check_circle');
  }

  error(message: string) {
    this.trigger(message, 'error', 'cancel');
  }

  warning(message: string) {
    this.trigger(message, 'warning', 'warning');
  }

  info(message: string) {
    this.trigger(message, 'info', 'info');
  }
}
