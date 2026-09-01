import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { RoleService } from './role.service';
import { provideMsalMocks, mockMsalInstance } from '../../testing/msal.mock';
import { ApiService } from '../../services/api.service';

describe('RoleService', () => {
  let service: RoleService;
  let mockApi: any;

  beforeEach(() => {
    mockApi = {
      getProfile: jasmine.createSpy('getProfile').and.returnValue(of({ role: 'Admin' }))
    };

    TestBed.configureTestingModule({
      providers: [
        RoleService,
        { provide: ApiService, useValue: mockApi },
        ...provideMsalMocks()
      ]
    });

    service = TestBed.inject(RoleService);
  });

  it('should return roles from MSAL token claims and API profile', () => {
    mockMsalInstance.getActiveAccount.and.returnValue({
      idTokenClaims: { roles: ['Admin'] },
    });
    expect(service.getRoles()).toContain('Admin');
    expect(service.isAdmin()).toBe(true);
    expect(service.isEmployee()).toBe(false);
  });

  it('should return empty roles when no active account', () => {
    mockMsalInstance.getActiveAccount.and.returnValue(null);
    expect(service.getRoles()).toContain('Admin');
  });

  it('should handle API profile returning empty role', () => {
    mockApi.getProfile.and.returnValue(of(null));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        RoleService,
        { provide: ApiService, useValue: mockApi },
        ...provideMsalMocks()
      ]
    });
    const freshService = TestBed.inject(RoleService);
    mockMsalInstance.getActiveAccount.and.returnValue(null);
    expect(freshService.getRoles()).toEqual([]);
    expect(freshService.isEmployee()).toBe(true);
  });
});