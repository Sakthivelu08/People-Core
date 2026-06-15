import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { RouterModule } from '@angular/router';
import { provideMsalMocks, mockMsalBroadcastService, mockMsalInstance } from './testing/msal.mock';
import { Subject } from 'rxjs';
import { EventType, InteractionStatus } from '@azure/msal-browser';

describe('AppComponent', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockMsalInstance.getActiveAccount.mockReturnValue({
      idTokenClaims: { roles: ['Admin'] },
    });
    mockMsalInstance.getAllAccounts.mockReturnValue([{}]);
    mockMsalBroadcastService.msalSubject$ = new Subject();
    mockMsalBroadcastService.inProgress$ = new Subject();

    await TestBed.configureTestingModule({
      imports: [AppComponent, RouterModule.forRoot([])],
      providers: [...provideMsalMocks()],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should set active account on LOGIN_SUCCESS event', () => {
    const account = { username: 'user@test.com' };
    mockMsalInstance.getAllAccounts.mockReturnValue([account]);
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    (mockMsalBroadcastService.msalSubject$ as Subject<any>).next({
      eventType: EventType.LOGIN_SUCCESS,
    });

    expect(mockMsalInstance.setActiveAccount).toHaveBeenCalledWith(account);
  });

  it('should restore active account when inProgress is None', () => {
    const account = { username: 'restored@test.com' };
    mockMsalInstance.getActiveAccount.mockReturnValue(null);
    mockMsalInstance.getAllAccounts.mockReturnValue([account]);
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    (mockMsalBroadcastService.inProgress$ as Subject<any>).next(
      InteractionStatus.None
    );

    expect(mockMsalInstance.setActiveAccount).toHaveBeenCalledWith(account);
  });

  it('should leave active account unchanged when no accounts exist after login', () => {
    mockMsalInstance.getAllAccounts.mockReturnValueOnce([]);
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    (mockMsalBroadcastService.msalSubject$ as Subject<any>).next({
      eventType: EventType.LOGIN_SUCCESS,
    });

    expect(mockMsalInstance.setActiveAccount).not.toHaveBeenCalled();
  });

  it('should not restore active account when one is already active', () => {
    mockMsalInstance.getActiveAccount.mockReturnValue({ username: 'user@test.com' });
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    (mockMsalBroadcastService.inProgress$ as Subject<any>).next(
      InteractionStatus.None
    );

    expect(mockMsalInstance.setActiveAccount).not.toHaveBeenCalled();
  });

  it('should not restore active account when no accounts exist', () => {
    mockMsalInstance.getActiveAccount.mockReturnValue(null);
    mockMsalInstance.getAllAccounts.mockReturnValue([]);
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    (mockMsalBroadcastService.inProgress$ as Subject<any>).next(
      InteractionStatus.None
    );

    expect(mockMsalInstance.setActiveAccount).not.toHaveBeenCalled();
  });
});
