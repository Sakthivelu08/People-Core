import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RoleService } from '../core/services/role.service';
import { adminGuard } from './role.guard';

describe('adminGuard', () => {
  const router = { navigate: jest.fn() };
  const roleService = { isAdmin: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: RoleService, useValue: roleService },
      ],
    });
  });

  it('allows admin users', () => {
    roleService.isAdmin.mockReturnValue(true);

    const result = TestBed.runInInjectionContext(() =>
      adminGuard({} as any, {} as any)
    );

    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('redirects non-admin users home', () => {
    roleService.isAdmin.mockReturnValue(false);

    const result = TestBed.runInInjectionContext(() =>
      adminGuard({} as any, {} as any)
    );

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/home']);
  });
});
