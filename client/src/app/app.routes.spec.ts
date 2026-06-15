import { routes } from './app.routes';
import { LoginComponent } from './auth/login/login.component';
import { authGuard } from './auth/auth.guard';
import { adminGuard } from './auth/role.guard';

describe('routes', () => {
  it('defines the default and fallback redirects', () => {
    expect(routes[0]).toMatchObject({
      path: '',
      redirectTo: 'login',
      pathMatch: 'full',
    });
    expect(routes.at(-1)).toMatchObject({
      path: '**',
      redirectTo: 'login',
    });
  });

  it('protects login and shell routes with auth guard', () => {
    expect(routes[1].canActivate).toContain(authGuard);
    expect(routes[2].canActivate).toContain(authGuard);
  });

  it('protects admin child routes with admin guard', () => {
    const children = routes[2].children ?? [];
    expect(children.find(route => route.path === 'onboarding')?.canActivate).toContain(adminGuard);
    expect(children.find(route => route.path === 'admin/onboarding')?.canActivate).toContain(adminGuard);
  });

  it('loads lazy route components', async () => {
    const shellRoute = routes[2];
    const children = shellRoute.children ?? [];

    await expect(routes[1].loadComponent?.()).resolves.toBe(LoginComponent);
    await expect(shellRoute.loadComponent?.()).resolves.toBeDefined();

    for (const route of children) {
      await expect(route.loadComponent?.()).resolves.toBeDefined();
    }
  });
});
