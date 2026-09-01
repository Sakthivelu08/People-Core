import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { AppComponent } from './app.component';
import { provideMsalMocks, mockMsalInstance, mockMsalBroadcastService } from './testing/msal.mock';
import { ApiService } from './services/api.service';
import { EventType, InteractionStatus } from '@azure/msal-browser';

describe('AppComponent', () => {
  let mockApi: any;

  beforeEach(() => {
    mockApi = {
      getProfile: jasmine.createSpy('getProfile').and.returnValue(of({ role: 'Admin' }))
    };

    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ApiService, useValue: mockApi },
        ...provideMsalMocks()
      ]
    });
  });

  it('should create the app and set active account on login success & reload', () => {
    mockMsalInstance.getAllAccounts.and.returnValue([{ username: 'test@ex.com' }]);
    mockMsalInstance.getActiveAccount.and.returnValue(null);

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    mockMsalBroadcastService.msalSubject$.next({ eventType: EventType.LOGIN_SUCCESS });
    expect(mockMsalInstance.setActiveAccount).toHaveBeenCalledWith({ username: 'test@ex.com' });

    mockMsalBroadcastService.inProgress$.next(InteractionStatus.None);
    expect(mockMsalInstance.setActiveAccount).toHaveBeenCalled();
  });
});
