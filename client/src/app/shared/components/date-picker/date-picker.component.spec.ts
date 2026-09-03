import { TestBed, ComponentFixture } from '@angular/core/testing';
import { DatePickerComponent } from './date-picker.component';

describe('DatePickerComponent', () => {
  let fixture: ComponentFixture<DatePickerComponent>;
  let component: DatePickerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatePickerComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(DatePickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and initialize defaults', () => {
    expect(component).toBeTruthy();
    expect(component.isOpen()).toBe(false);
    expect(component.formattedValue()).toBe('');
  });

  it('should format value or return raw string if format invalid', () => {
    component.value.set('invalid-format');
    expect(component.formattedValue()).toBe('invalid-format');

    component.value.set('2026-06-20');
    expect(component.formattedValue()).toBe('20-06-2026');
  });

  it('should toggle dropdown state and navigate months', () => {
    const event = new MouseEvent('click');
    component.value.set('2026-06-20');
    component.toggle();
    expect(component.isOpen()).toBe(true);

    // Toggle with invalid date string
    component.isOpen.set(false);
    component.value.set('invalid-date');
    component.toggle();
    expect(component.isOpen()).toBe(true);

    // Prev month from January to December
    component.currentMonth.set(0);
    component.prevMonth(event);
    expect(component.currentMonth()).toBe(11);

    // Next month from December to January
    component.nextMonth(event);
    expect(component.currentMonth()).toBe(0);

    // Normal prev and next month
    component.currentMonth.set(5);
    component.prevMonth(event);
    expect(component.currentMonth()).toBe(4);
    component.nextMonth(event);
    expect(component.currentMonth()).toBe(5);
  });

  it('should select day, clear, and set today', () => {
    const event = new MouseEvent('click');
    component.currentYear.set(2026);
    component.currentMonth.set(5);

    component.selectDay(null, event);
    expect(component.value()).toBe('');

    component.selectDay(15, event);
    expect(component.value()).toBe('2026-06-15');
    expect(component.formattedValue()).toBe('15-06-2026');

    component.clear(event);
    expect(component.value()).toBe('');

    component.setToday(event);
    expect(component.value()).not.toBe('');
  });

  it('should test isSelected and isToday helpers', () => {
    const today = new Date();
    component.currentYear.set(today.getFullYear());
    component.currentMonth.set(today.getMonth());
    component.value.set('');

    expect(component.isSelected(null)).toBe(false);
    expect(component.isSelected(today.getDate())).toBe(false);

    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    component.value.set(`${today.getFullYear()}-${m}-${d}`);

    expect(component.isSelected(today.getDate())).toBe(true);

    expect(component.isToday(null)).toBe(false);
    expect(component.isToday(today.getDate())).toBe(true);
  });

  it('should handle ControlValueAccessor and disabled state', () => {
    const fnChange = jasmine.createSpy('fnChange');
    const fnTouched = jasmine.createSpy('fnTouched');
    component.registerOnChange(fnChange);
    component.registerOnTouched(fnTouched);

    component.writeValue('2026-10-10');
    expect(component.value()).toBe('2026-10-10');

    component.setDisabledState!(true);
    expect(component.isDisabled()).toBe(true);

    component.toggle();
    expect(component.isOpen()).toBe(false);
  });

  it('should handle document click to close or keep dropdown open', () => {
    component.isOpen.set(true);
    const outsideEvent = new MouseEvent('click');
    component.onDocumentClick(outsideEvent);
    expect(component.isOpen()).toBe(false);

    component.isOpen.set(true);
    const insideEvent = { target: fixture.nativeElement } as any;
    component.onDocumentClick(insideEvent);
    expect(component.isOpen()).toBe(true);
  });
});
