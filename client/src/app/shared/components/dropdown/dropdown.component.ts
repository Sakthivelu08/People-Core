import { Component, input, signal, computed, HostListener, ElementRef, inject, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dropdown.component.html',
  styleUrls: ['./dropdown.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DropdownComponent),
      multi: true
    }
  ]
})
export class DropdownComponent implements ControlValueAccessor {
  options = input<{ value: any; label: string }[]>([]);
  placeholder = input<string>('Select option');

  value = signal<any>(null);
  isOpen = signal<boolean>(false);
  isDisabled = signal<boolean>(false);

  private elementRef = inject(ElementRef);

  onChange = (_val: any) => {};
  onTouched = () => {};

  selectedLabel = computed(() => {
    const selected = this.options().find(opt => opt.value === this.value());
    return selected ? selected.label : this.placeholder();
  });

  toggle() {
    if (this.isDisabled()) return;
    this.isOpen.update(open => !open);
  }

  select(val: any, event: MouseEvent) {
    event.stopPropagation();
    this.value.set(val);
    this.onChange(val);
    this.onTouched();
    this.isOpen.set(false);
  }

  // ControlValueAccessor implementations
  writeValue(val: any): void {
    this.value.set(val);
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
