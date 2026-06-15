import { TestBed, ComponentFixture } from '@angular/core/testing';
import { HomeComponent } from './home.component';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideMsalMocks, mockMsalService, mockMsalInstance } from '../../testing/msal.mock';

const mockProfile = {
  id: 'user-123',
  displayName: 'Sakthivelu Selvam',
  mail: 'sakthivelu@test.com',
  userPrincipalName: 'sakthivelu@test.com',
  jobTitle: 'Developer',
  department: 'Engineering',
  officeLocation: 'Chennai',
  businessPhones: ['9876543210'],
};

describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;
  let component: HomeComponent;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockMsalInstance.getActiveAccount.mockReturnValue({
      idTokenClaims: { roles: ['Admin'] },
    });

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ...provideMsalMocks(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should do nothing if no active account', async () => {
    mockMsalInstance.getActiveAccount.mockReturnValue(null);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.profile).toBeUndefined();
  });

  it('should fetch profile and set data', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const profileReq = httpMock.expectOne('https://graph.microsoft.com/v1.0/me');
    profileReq.flush(mockProfile);

    httpMock.expectOne('https://graph.microsoft.com/v1.0/me/photo/$value').flush(new Blob());
    httpMock.expectOne('https://graph.microsoft.com/v1.0/me/memberOf').flush({ value: [{ id: 'g1', displayName: 'MSFT' }] });

    expect(component.profile.displayName).toBe('Sakthivelu Selvam');
  });

  it('should set roles from idTokenClaims', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    httpMock.expectOne('https://graph.microsoft.com/v1.0/me').flush(mockProfile);
    httpMock.expectOne('https://graph.microsoft.com/v1.0/me/photo/$value').flush(new Blob());
    httpMock.expectOne('https://graph.microsoft.com/v1.0/me/memberOf').flush({ value: [] });

    expect(component.roles).toContain('Admin');
  });

  it('should default roles to empty array when token has no roles', async () => {
    mockMsalInstance.getActiveAccount.mockReturnValue({ idTokenClaims: {} });

    fixture.detectChanges();
    await fixture.whenStable();

    httpMock.expectOne('https://graph.microsoft.com/v1.0/me').flush(mockProfile);
    httpMock.expectOne('https://graph.microsoft.com/v1.0/me/photo/$value').flush(new Blob());
    httpMock.expectOne('https://graph.microsoft.com/v1.0/me/memberOf').flush({ value: [] });

    expect(component.roles).toEqual([]);
  });

  it('should handle photo fetch error gracefully', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    httpMock.expectOne('https://graph.microsoft.com/v1.0/me').flush(mockProfile);
    httpMock.expectOne('https://graph.microsoft.com/v1.0/me/photo/$value').error(new ErrorEvent('Not found'));
    httpMock.expectOne('https://graph.microsoft.com/v1.0/me/memberOf').flush({ value: [] });

    expect(component.photoUrl).toBeNull();
  });

  it('should call logoutRedirect on logout()', () => {
    component.logout();
    expect(mockMsalService.logoutRedirect).toHaveBeenCalled();
  });
});
