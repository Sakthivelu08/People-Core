import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { LoginComponent } from './login.component';
import { provideMsalMocks, mockMsalService, mockMsalInstance } from '../../testing/msal.mock';

describe('LoginComponent Unit Tests', () => {
  let mockRouter: any;

  beforeEach(() => {
    mockRouter = { navigate: jasmine.createSpy('navigate') };

    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: Router, useValue: mockRouter },
        ...provideMsalMocks()
      ]
    });
  });

  it('should create component', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should trigger loginRedirect on login() call', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;
    component.login();
    expect(mockMsalService.loginRedirect).toHaveBeenCalled();
  });
});
