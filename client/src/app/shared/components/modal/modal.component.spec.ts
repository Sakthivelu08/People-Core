import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ModalComponent } from './modal.component';

describe('ModalComponent', () => {
  let fixture: ComponentFixture<ModalComponent>;
  let component: ModalComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and emit output on onClose() call', () => {
    expect(component).toBeTruthy();
    spyOn(component.close, 'emit');

    component.onClose();
    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should emit onClose on backdrop click and ignore inner modal clicks', () => {
    spyOn(component.close, 'emit');
    
    const mockOverlay = document.createElement('div');
    mockOverlay.classList.add('modal-overlay');
    component.onBackdropClick({ target: mockOverlay } as any);
    expect(component.close.emit).toHaveBeenCalledTimes(1);

    const mockContent = document.createElement('div');
    mockContent.classList.add('modal-card');
    component.onBackdropClick({ target: mockContent } as any);
    expect(component.close.emit).toHaveBeenCalledTimes(1); // not incremented
  });
});
