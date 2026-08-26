import { Component, input, signal, computed, HostListener, ElementRef, OnInit, inject, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './date-picker.component.html',
  styleUrls: ['./date-picker.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatePickerComponent),
      multi: true
    }
  ]
})
export class DatePickerComponent implements ControlValueAccessor, OnInit {
  placeholder = input<string>('Select date');
  theme = input<'employee' | 'admin'>('employee');

  value = signal<string>(''); // YYYY-MM-DD format
  isOpen = signal<boolean>(false);
  isDisabled = signal<boolean>(false);

  currentDate = new Date();
  currentMonth = signal<number>(0);
  currentYear = signal<number>(0);

  monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  daysGrid = signal<{ dayNumber: number | null; isCurrentMonth: boolean; dateStr: string }[]>([]);

  private elementRef = inject(ElementRef);

  onChange = (_val: string) => {};
  onTouched = () => {};

  ngOnInit() {
    this.currentMonth.set(this.currentDate.getMonth());
    this.currentYear.set(this.currentDate.getFullYear());
    this.generateCalendar();
  }

  formattedValue = computed(() => {
    const val = this.value();
    if (!val) return '';
    const parts = val.split('-');
    if (parts.length !== 3) return val;
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  });

  toggle() {
    if (this.isDisabled()) return;
    this.isOpen.update(open => !open);
    const val = this.value();
    if (this.isOpen() && val) {
      const selected = new Date(val);
      if (!isNaN(selected.getTime())) {
        this.currentMonth.set(selected.getMonth());
        this.currentYear.set(selected.getFullYear());
        this.generateCalendar();
      }
    }
  }

  prevMonth(event: MouseEvent) {
    event.stopPropagation();
    if (this.currentMonth() === 0) {
      this.currentMonth.set(11);
      this.currentYear.update(y => y - 1);
    } else {
      this.currentMonth.update(m => m - 1);
    }
    this.generateCalendar();
  }

  nextMonth(event: MouseEvent) {
    event.stopPropagation();
    if (this.currentMonth() === 11) {
      this.currentMonth.set(0);
      this.currentYear.update(y => y + 1);
    } else {
      this.currentMonth.update(m => m + 1);
    }
    this.generateCalendar();
  }

  selectDay(day: number | null, event: MouseEvent) {
    event.stopPropagation();
    if (!day) return;

    const m = String(this.currentMonth() + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    const dateVal = `${this.currentYear()}-${m}-${d}`;
    
    this.value.set(dateVal);
    this.onChange(dateVal);
    this.onTouched();
    this.isOpen.set(false);
  }

  clear(event: MouseEvent) {
    event.stopPropagation();
    this.value.set('');
    this.onChange('');
    this.onTouched();
    this.isOpen.set(false);
  }

  setToday(event: MouseEvent) {
    event.stopPropagation();
    const today = new Date();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const dateVal = `${today.getFullYear()}-${m}-${d}`;
    
    this.value.set(dateVal);
    this.onChange(dateVal);
    this.onTouched();
    this.isOpen.set(false);
  }

  generateCalendar() {
    const grid: { dayNumber: number | null; isCurrentMonth: boolean; dateStr: string }[] = [];

    const firstDayIndex = new Date(this.currentYear(), this.currentMonth(), 1).getDay();
    const totalDays = new Date(this.currentYear(), this.currentMonth() + 1, 0).getDate();

    // Pad preceding days
    for (let i = 0; i < firstDayIndex; i++) {
      grid.push({ dayNumber: null, isCurrentMonth: false, dateStr: '' });
    }

    // Fill days of the month
    for (let i = 1; i <= totalDays; i++) {
      const m = String(this.currentMonth() + 1).padStart(2, '0');
      const d = String(i).padStart(2, '0');
      const dateStr = `${this.currentYear()}-${m}-${d}`;
      grid.push({ dayNumber: i, isCurrentMonth: true, dateStr });
    }

    this.daysGrid.set(grid);
  }

  isSelected(day: number | null): boolean {
    if (!day || !this.value()) return false;
    const m = String(this.currentMonth() + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    const dateStr = `${this.currentYear()}-${m}-${d}`;
    return this.value() === dateStr;
  }

  isToday(day: number | null): boolean {
    if (!day) return false;
    const today = new Date();
    return today.getDate() === day &&
           today.getMonth() === this.currentMonth() &&
           today.getFullYear() === this.currentYear();
  }

  writeValue(val: string): void {
    this.value.set(val || '');
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }
}
