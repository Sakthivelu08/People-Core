import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { DropdownComponent } from './dropdown.component';

describe('DropdownComponent', () => {
  let fixture: ComponentFixture<DropdownComponent>;
  let component: DropdownComponent;
  let componentRef: ComponentRef<DropdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DropdownComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(DropdownComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;

    componentRef.setInput('options', [
      { value: 'opt1', label: 'Option 1' },
      { value: 'opt2', label: 'Option 2' }
    ]);
    componentRef.setInput('placeholder', 'Choose...');

    fixture.detectChanges();
  });

  it('should create and calculate selectedLabel', () => {
    expect(component).toBeTruthy();
    expect(component.selectedLabel()).toBe('Choose...');

    component.writeValue('opt1');
    expect(component.selectedLabel()).toBe('Option 1');
  });

  it('should toggle dropdown state and handle disabled state', () => {
    component.toggle();
    expect(component.isOpen()).toBe(true);

    component.setDisabledState!(true);
    component.toggle();
    expect(component.isOpen()).toBe(true);
  });

  it('should select option and close dropdown', () => {
    const event = new MouseEvent('click');
    const fnChange = jasmine.createSpy('fnChange');
    const fnTouched = jasmine.createSpy('fnTouched');
    component.registerOnChange(fnChange);
    component.registerOnTouched(fnTouched);

    component.select('opt2', event);
    expect(component.value()).toBe('opt2');
    expect(fnChange).toHaveBeenCalledWith('opt2');
    expect(fnTouched).toHaveBeenCalled();
    expect(component.isOpen()).toBe(false);
  });

  it('should close dropdown on outside document click', () => {
    component.isOpen.set(true);
    const outsideEvent = new MouseEvent('click');
    component.onDocumentClick(outsideEvent);
    expect(component.isOpen()).toBe(false);
  });
});
