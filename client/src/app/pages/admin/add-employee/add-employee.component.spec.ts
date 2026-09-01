import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { AddEmployeeComponent } from './add-employee.component';
import { ApiService } from '../../../services/api.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { provideMsalMocks, mockMsalInstance } from '../../../testing/msal.mock';

describe('AddEmployeeComponent Unit Tests', () => {
  let fixture: ComponentFixture<AddEmployeeComponent>;
  let component: AddEmployeeComponent;
  let mockApi: any;
  let mockSnackbar: any;

  beforeEach(async () => {
    mockApi = {
      registerEmployee: jasmine.createSpy('registerEmployee').and.returnValue(of({ id: 'emp-1' }))
    };

    mockSnackbar = {
      success: jasmine.createSpy('success'),
      error: jasmine.createSpy('error'),
      warning: jasmine.createSpy('warning')
    };

    await TestBed.configureTestingModule({
      imports: [AddEmployeeComponent, HttpClientTestingModule],
      providers: [
        { provide: ApiService, useValue: mockApi },
        { provide: SnackbarService, useValue: mockSnackbar },
        ...provideMsalMocks()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddEmployeeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize form with default values', () => {
    expect(component).toBeTruthy();
    expect(component.employeeForm).toBeDefined();
    expect(component.employeeForm.valid).toBe(false);
  });

  it('should return early on onSubmit if form is invalid', () => {
    component.onSubmit();
    expect(mockApi.registerEmployee).not.toHaveBeenCalled();
  });

  it('should submit form and trigger fallback registration when MSAL fails token', fakeAsync(() => {
    mockMsalInstance.acquireTokenSilent.and.rejectWith(new Error('Token error'));

    component.employeeForm.patchValue({
      name: 'Priya Rajan',
      email: 'priya@ex.com',
      jobTitle: 'Senior Analyst',
      department: 'Sales',
      role: 'Employee'
    });

    component.onSubmit();
    tick();

    expect(mockApi.registerEmployee).toHaveBeenCalled();
    expect(mockSnackbar.warning).toHaveBeenCalled();
  }));

  it('should handle registration database error', fakeAsync(() => {
    mockMsalInstance.acquireTokenSilent.and.rejectWith(new Error('Token error'));
    mockApi.registerEmployee.and.returnValue(throwError(() => ({ error: { error: 'Duplicate entry' } })));

    component.employeeForm.patchValue({
      name: 'Priya Rajan',
      email: 'priya@ex.com',
      jobTitle: 'Senior Analyst',
      department: 'Sales',
      role: 'Employee'
    });

    component.onSubmit();
    tick();

    expect(mockSnackbar.error).toHaveBeenCalledWith('Duplicate entry');
    expect(component.submitting()).toBe(false);
  }));
});
