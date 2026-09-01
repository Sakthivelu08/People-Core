import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { SnackbarComponent } from './snackbar.component';
import { SnackbarService } from '../../../core/services/snackbar.service';

describe('SnackbarComponent', () => {
  let fixture: ComponentFixture<SnackbarComponent>;
  let component: SnackbarComponent;
  let snackbarService: SnackbarService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SnackbarComponent],
      providers: [SnackbarService]
    }).compileComponents();

    fixture = TestBed.createComponent(SnackbarComponent);
    component = fixture.componentInstance;
    snackbarService = TestBed.inject(SnackbarService);
    fixture.detectChanges();
  });

  it('should create component and receive alerts', fakeAsync(() => {
    expect(component).toBeTruthy();
    expect(component.alerts().length).toBe(0);

    snackbarService.success('Item saved!');
    tick();

    expect(component.alerts().length).toBe(1);
    expect(component.alerts()[0].message).toBe('Item saved!');

    // Advance 3000ms timer for auto-dismiss
    tick(3000);
    expect(component.alerts().length).toBe(0);
  }));

  it('should manually dismiss alert and handle ngOnDestroy unsubscription', fakeAsync(() => {
    snackbarService.error('Error occurred');
    tick();

    const alertId = component.alerts()[0].id;
    component.dismiss(alertId);
    expect(component.alerts().length).toBe(0);

    fixture.destroy();
  }));
});
