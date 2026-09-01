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

  currentDate = signal<Date>(new Date());

  historyHeaders = ['Type', 'From', 'To', 'Days', 'Reason', 'Applied', 'Status'];

  leaveTypeOptions = [
    { value: 'annual', label: 'Annual' },
    { value: 'sick', label: 'Sick' },
    { value: 'casual', label: 'Casual' }
  ];

  monthYearLabel = computed(() => {
    const d = this.currentDate();
    return d.toLocaleString('default', { month: 'long', year: 'numeric' });
  });

  calendarGrid = computed(() => {
    const curr = this.currentDate();
    const year = curr.getFullYear();
    const month = curr.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const reqs = this.requests();

    const grid = [];

    // Empty padding slots before first day
    for (let i = 0; i < firstDayIndex; i++) {
      grid.push({ dayNumber: null, isToday: false, leave: null });
    }

    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(year, month, day);
      const isToday = 
        dayDate.getDate() === today.getDate() &&
        dayDate.getMonth() === today.getMonth() &&
        dayDate.getFullYear() === today.getFullYear();

      // Check if any leave request overlaps with this date
      const activeLeave = reqs.find(r => {
        const rawStart = r.startDate || (r as any).start_date;
        const rawEnd = r.endDate || (r as any).end_date;
        if (!rawStart || !rawEnd) return false;
        
        const start = new Date(rawStart);
        const end = new Date(rawEnd);
        start.setHours(0,0,0,0);
        end.setHours(23,59,59,999);
        return dayDate >= start && dayDate <= end;
      });

      grid.push({
        dayNumber: day,
        isToday,
        leave: activeLeave || null
      });
    }

    return grid;
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
      next: (reqs) => {
        this.requests.set(reqs);
        // Automatically view the month of the most recent leave request if available
        if (reqs && reqs.length > 0) {
          const latest = reqs[0];
          const rawStart = latest.startDate || (latest as any).start_date;
          if (rawStart) {
            const d = new Date(rawStart);
            this.currentDate.set(new Date(d.getFullYear(), d.getMonth(), 1));
          }
        }
      },
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

  prevMonth() {
    const d = this.currentDate();
    this.currentDate.set(new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  nextMonth() {
    const d = this.currentDate();
    this.currentDate.set(new Date(d.getFullYear(), d.getMonth() + 1, 1));
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