import { TestBed } from '@angular/core/testing';
import { RoleService } from './role.service';
import { provideMsalMocks, mockMsalInstance } from '../../testing/msal.mock';

describe('RoleService', () => {
  let service: RoleService;

  beforeEach(() => {
    jest.clearAllMocks();
    TestBed.configureTestingModule({ providers: [...provideMsalMocks()] });
    service = TestBed.inject(RoleService);
  });

  it('should return roles from token claims', () => {
    mockMsalInstance.getActiveAccount.mockReturnValue({
      idTokenClaims: { roles: ['Admin'] },
    });
    expect(service.getRoles()).toContain('Admin');
  });

  it('should return empty array when no account', () => {
    mockMsalInstance.getActiveAccount.mockReturnValue(null);
    expect(service.getRoles()).toEqual([]);
  });

  it('should return true for isAdmin when role is Admin', () => {
    mockMsalInstance.getActiveAccount.mockReturnValue({
      idTokenClaims: { roles: ['Admin'] },
    });
    expect(service.isAdmin()).toBe(true);
  });

  it('should return false for isAdmin when role is Employee', () => {
    mockMsalInstance.getActiveAccount.mockReturnValue({
      idTokenClaims: { roles: ['Employee'] },
    });
    expect(service.isAdmin()).toBe(false);
  });

  it('should return true for isEmployee when not Admin', () => {
    mockMsalInstance.getActiveAccount.mockReturnValue({
      idTokenClaims: { roles: ['Employee'] },
    });
    expect(service.isEmployee()).toBe(true);
  });

  it('should return false for isEmployee when Admin', () => {
    mockMsalInstance.getActiveAccount.mockReturnValue({
      idTokenClaims: { roles: ['Admin'] },
    });
    expect(service.isEmployee()).toBe(false);
  });
});