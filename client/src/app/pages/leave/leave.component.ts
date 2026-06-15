import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { LeaveService } from '../../core/services/leave.service';
import { LeaveRequest, LeaveBalance } from '../../core/models/leave.model';

@Component({
  selector: 'app-leave',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './leave.component.html',
  styleUrls: ['./leave.component.scss'],
})
export class LeaveComponent implements OnInit {
  requests: LeaveRequest[] = [];
  balance!: LeaveBalance;
  showForm = false;
  submitSuccess = false;
  constructor(private leaveService: LeaveService, private fb: FormBuilder) {}

  leaveForm!: ReturnType<FormBuilder['group']>;

    ngOnInit() {
    this.leaveForm = this.fb.group({
        type:      ['annual', Validators.required],
        startDate: ['', Validators.required],
        endDate:   ['', Validators.required],
        reason:    ['', [Validators.required, Validators.minLength(10)]],
    });
    this.load();
    }

  load() {
    this.requests = this.leaveService.getAll();
    this.balance  = this.leaveService.getBalance();
  }

  get days(): number {
    const { startDate, endDate } = this.leaveForm.value;
    if (!startDate || !endDate) return 0;
    const diff = new Date(endDate).getTime() - new Date(startDate).getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1);
  }

  submit() {
    if (this.leaveForm.invalid) return;
    const v = this.leaveForm.value;
    this.leaveService.add({
      type:      v.type as any,
      startDate: v.startDate!,
      endDate:   v.endDate!,
      days:      this.days,
      reason:    v.reason!,
    });
    this.leaveForm.reset({ type: 'annual' });
    this.showForm = false;
    this.submitSuccess = true;
    this.load();
    setTimeout(() => (this.submitSuccess = false), 3000);
  }
}