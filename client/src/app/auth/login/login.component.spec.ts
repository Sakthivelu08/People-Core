import { TestBed, ComponentFixture } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { provideMsalMocks, mockMsalService } from '../../testing/msal.mock';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;

  beforeEach(async () => {
    jest.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [...provideMsalMocks()],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call loginRedirect when login() is called', () => {
    component.login();
    expect(mockMsalService.loginRedirect).toHaveBeenCalledTimes(1);
  });

  it('should render a login button', () => {
    const btn = fixture.nativeElement.querySelector('button');
    expect(btn).toBeTruthy();
  });
});