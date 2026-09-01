import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { adminGuard } from './role.guard';
import { RoleService } from '../core/services/role.service';

describe('adminGuard Unit Tests', () => {
  let mockRoleService: any;
  let mockRouter: any;

  beforeEach(() => {
    mockRoleService = {
      isAdmin: jasmine.createSpy('isAdmin')
    };
    mockRouter = {
      navigate: jasmine.createSpy('navigate')
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: RoleService, useValue: mockRoleService },
        { provide: Router, useValue: mockRouter }
      ]
    });
  });

  it('allows access when user is Admin', () => {
    mockRoleService.isAdmin.and.returnValue(true);
    const result = TestBed.runInInjectionContext(() => adminGuard({} as any, {} as any));
    expect(result).toBe(true);
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('redirects to profile and returns false when user is not Admin', () => {
    mockRoleService.isAdmin.and.returnValue(false);
    const result = TestBed.runInInjectionContext(() => adminGuard({} as any, {} as any));
    expect(result).toBe(false);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/employee/profile']);
  });
});
