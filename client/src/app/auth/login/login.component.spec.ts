import { TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { MsalService } from '@azure/msal-angular';

describe('LoginComponent', () => {
  let component: LoginComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        {
          provide: MsalService,
          useValue: { loginRedirect: jasmine.createSpy('loginRedirect') }
        }
      ]
    });

    const fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
