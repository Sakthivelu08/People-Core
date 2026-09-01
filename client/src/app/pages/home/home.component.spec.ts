import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { HomeComponent } from './home.component';
import { provideMsalMocks, mockMsalInstance, mockMsalService } from '../../testing/msal.mock';
import { ApiService } from '../../services/api.service';

describe('HomeComponent', () => {
  let mockApi: any;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    mockApi = {
      getProfile: jasmine.createSpy('getProfile').and.returnValue(of({
        name: 'Aarav Sharma',
        role: 'Admin',
        email: 'aarav@ex.com'
      }))
    };

    await TestBed.configureTestingModule({
      imports: [HomeComponent, HttpClientTestingModule],
      providers: [
        { provide: ApiService, useValue: mockApi },
        ...provideMsalMocks()
      ]
    }).compileComponents();

    httpTesting = TestBed.inject(HttpTestingController);
  });

  it('should return early from ngOnInit when no active account', fakeAsync(() => {
    mockMsalInstance.getActiveAccount.and.returnValue(null);

    const fixture = TestBed.createComponent(HomeComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    tick();

    expect(mockApi.getProfile).not.toHaveBeenCalled();
  }));

  it('should fetch Microsoft Graph profile, photo, and groups successfully', fakeAsync(() => {
    mockMsalInstance.getActiveAccount.and.returnValue({
      idTokenClaims: { roles: ['Admin'] }
    });
    mockMsalInstance.acquireTokenSilent.and.resolveTo({ accessToken: 'mock-access-token' });

    const fixture = TestBed.createComponent(HomeComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    tick();

    const reqMe = httpTesting.expectOne('https://graph.microsoft.com/v1.0/me');
    reqMe.flush({ displayName: 'Aarav Sharma', jobTitle: 'Lead' });

    const reqPhoto = httpTesting.expectOne('https://graph.microsoft.com/v1.0/me/photo/$value');
    reqPhoto.flush(new Blob(['photo'], { type: 'image/jpeg' }));

    const reqGroups = httpTesting.expectOne('https://graph.microsoft.com/v1.0/me/memberOf');
    reqGroups.flush({ value: [{ displayName: 'Engineering' }] });
    tick();

    expect(component.profile().displayName).toBe('Aarav Sharma');
    expect(component.groups().length).toBe(1);
    expect(component.isAdmin).toBe(true);
  }));

  it('should handle photo fetch error gracefully', fakeAsync(() => {
    mockMsalInstance.getActiveAccount.and.returnValue({ idTokenClaims: {} });
    mockMsalInstance.acquireTokenSilent.and.resolveTo({ accessToken: 'mock-access-token' });

    const fixture = TestBed.createComponent(HomeComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    tick();

    httpTesting.expectOne('https://graph.microsoft.com/v1.0/me').flush({});
    httpTesting.expectOne('https://graph.microsoft.com/v1.0/me/photo/$value').error(new ProgressEvent('error'));
    httpTesting.expectOne('https://graph.microsoft.com/v1.0/me/memberOf').flush({ value: [] });
    tick();

    expect(component.photoUrl()).toBeNull();
  }));

  it('should handle db profile error gracefully and call logout', fakeAsync(() => {
    mockMsalInstance.getActiveAccount.and.returnValue({ idTokenClaims: {} });
    mockMsalInstance.acquireTokenSilent.and.rejectWith(new Error('Token error'));
    mockApi.getProfile.and.returnValue(throwError(() => new Error('DB error')));

    const fixture = TestBed.createComponent(HomeComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    tick();

    expect(component.dbProfile()).toBeNull();

    component.logout();
    expect(mockMsalService.logoutRedirect).toHaveBeenCalled();
  }));
});
