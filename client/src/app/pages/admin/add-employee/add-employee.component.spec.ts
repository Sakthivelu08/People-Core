import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { AddEmployeeComponent } from './add-employee.component';
import { ApiService } from '../../../services/api.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { provideMsalMocks, mockMsalInstance } from '../../../testing/msal.mock';
import { MICROSOFT_GRAPH_CONFIG } from '../../../core/constants/config.constants';

describe('AddEmployeeComponent Unit Tests', () => {
  let fixture: ComponentFixture<AddEmployeeComponent>;
  let component: AddEmployeeComponent;
  let mockApi: any;
  let mockSnackbar: any;
  let httpTesting: HttpTestingController;

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
    httpTesting = TestBed.inject(HttpTestingController);
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

  it('should create employee in Azure Graph and local DB successfully', fakeAsync(() => {
    mockMsalInstance.acquireTokenSilent.and.resolveTo({ accessToken: 'valid-graph-token' });

    component.employeeForm.patchValue({
      name: 'Priya Rajan',
      email: 'priya@ex.com',
      jobTitle: 'Senior Analyst',
      department: 'Sales',
      role: 'Employee'
    });

    component.onSubmit();
    tick();

    const req = httpTesting.expectOne(`${MICROSOFT_GRAPH_CONFIG.baseUrl}${MICROSOFT_GRAPH_CONFIG.endpoints.users}`);
    expect(req.request.method).toBe('POST');
    req.flush({ id: 'azure-oid-999' });
    tick();

    expect(mockApi.registerEmployee).toHaveBeenCalledWith(jasmine.objectContaining({
      azure_oid: 'azure-oid-999',
      name: 'Priya Rajan'
    }));
    expect(mockSnackbar.success).toHaveBeenCalled();
  }));

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

    mockApi.registerEmployee.and.returnValue(throwError(() => ({})));
    component.onSubmit();
    tick();

    expect(mockSnackbar.error).toHaveBeenCalledWith('Database registration failed. Please try again.');
  }));
});
