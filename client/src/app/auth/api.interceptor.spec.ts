import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { apiInterceptor } from './api.interceptor';
import { provideMsalMocks, mockMsalInstance } from '../testing/msal.mock';
import { environment } from '../../environments/environment';

describe('apiInterceptor Unit Tests', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiInterceptor])),
        provideHttpClientTesting(),
        ...provideMsalMocks()
      ]
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('bypasses requests not targeted at environment.apiUrl', () => {
    http.get('https://example.com/api/test').subscribe();
    const req = httpMock.expectOne('https://example.com/api/test');
    expect(req.request.headers.has('x-user-oid')).toBe(false);
    req.flush({});
  });

  it('bypasses header injection when no active MSAL account exists', () => {
    mockMsalInstance.getActiveAccount.and.returnValue(null);
    http.get(`${environment.apiUrl}/api/test`).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/test`);
    expect(req.request.headers.has('x-user-oid')).toBe(false);
    req.flush({});
  });

  it('handles active account without OID or localAccountId', (done) => {
    mockMsalInstance.getActiveAccount.and.returnValue({});
    mockMsalInstance.acquireTokenSilent.and.resolveTo({});

    http.get(`${environment.apiUrl}/api/test`).subscribe(() => done());

    setTimeout(() => {
      const req = httpMock.expectOne(`${environment.apiUrl}/api/test`);
      expect(req.request.headers.has('x-user-oid')).toBe(false);
      req.flush({});
    }, 50);
  });

  it('attaches x-user-oid and Bearer token on successful token acquisition', (done) => {
    mockMsalInstance.getActiveAccount.and.returnValue({
      idTokenClaims: { oid: 'test-oid-123' },
      localAccountId: 'test-oid-123'
    });
    mockMsalInstance.acquireTokenSilent.and.resolveTo({ idToken: 'test-jwt-token' });

    http.get(`${environment.apiUrl}/api/test`).subscribe(() => done());

    setTimeout(() => {
      const req = httpMock.expectOne(`${environment.apiUrl}/api/test`);
      expect(req.request.headers.get('x-user-oid')).toBe('test-oid-123');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-jwt-token');
      req.flush({});
    }, 50);
  });

  it('attaches x-user-oid header and falls back gracefully when token acquisition fails', (done) => {
    mockMsalInstance.getActiveAccount.and.returnValue({
      localAccountId: 'local-oid-456'
    });
    mockMsalInstance.acquireTokenSilent.and.rejectWith(new Error('Silent token error'));

    http.get(`${environment.apiUrl}/api/test`).subscribe(() => done());

    setTimeout(() => {
      const req = httpMock.expectOne(`${environment.apiUrl}/api/test`);
      expect(req.request.headers.get('x-user-oid')).toBe('local-oid-456');
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    }, 50);
  });
});
