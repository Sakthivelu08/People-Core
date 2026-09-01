import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { LeaveService } from '../../core/services/leave.service';
import { LeaveRequest, LeaveBalance } from '../../core/models/leave.model';
import { DropdownComponent } from '../../shared/components/dropdown/dropdown.component';
import { DatePickerComponent } from '../../shared/components/date-picker/date-picker.component';
import { MetricCardComponent } from '../../shared/components/metric-card/metric-card.component';
import { TableComponent } from '../../shared/components/table/table.component';
import { BeautifulDatePipe } from '../../shared/pipes/beautiful-date.pipe';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { SnackbarService } from '../../core/services/snackbar.service';

@Component({
  selector: 'app-leave',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DropdownComponent,
    DatePickerComponent,
    MetricCardComponent,
    TableComponent,
    BeautifulDatePipe,
    ModalComponent
  ],
  templateUrl: './leave.component.html',
  styleUrls: ['./leave.component.scss'],
})
export class LeaveComponent implements OnInit {
  requests = signal<LeaveRequest[]>([]);
  balance = signal<LeaveBalance | null>(null);
  showForm = signal<boolean>(false);

  historyHeaders = ['Type', 'From', 'To', 'Days', 'Reason', 'Applied', 'Status'];

  leaveTypeOptions = [
    { value: 'annual', label: 'Annual' },
    { value: 'sick', label: 'Sick' },
    { value: 'casual', label: 'Casual' }
  ];

  calendarDays = computed(() => {
    const daysArr = [];
    const today = new Date();
    for (let i = 1; i <= 31; i++) {
      const isToday = i === today.getDate();
      const hasLeave = i === 12 || i === 18 || i === 25;
      daysArr.push({ dayNumber: i, isToday, hasLeave, leaveType: i === 12 ? 'annual' : (i === 18 ? 'sick' : 'casual') });
    }
    return daysArr;
  });

  private leaveService = inject(LeaveService);
  private fb = inject(FormBuilder);
  private snackbar = inject(SnackbarService);

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
    this.leaveService.getAll().subscribe({
      next: (reqs) => this.requests.set(reqs),
      error: (err) => {
        console.error('Failed to get leaves:', err);
        this.snackbar.error('Failed to load leave history.');
      }
    });
    this.leaveService.getBalance().subscribe({
      next: (bal) => this.balance.set(bal),
      error: (err) => console.error('Failed to get balance:', err)
    });
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
    }).subscribe({
      next: () => {
        this.leaveForm.reset({ type: 'annual' });
        this.showForm.set(false);
        this.snackbar.success('Leave request submitted successfully!');
        this.load();
      },
      error: (err) => {
        console.error('Failed to submit leave:', err);
        this.snackbar.error('Failed to submit leave request.');
      }
    });
  }
}