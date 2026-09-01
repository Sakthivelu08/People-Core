import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { SidebarComponent } from './sidebar.component';
import { provideMsalMocks, mockMsalService } from '../../../testing/msal.mock';
import { RoleService } from '../../../core/services/role.service';

describe('SidebarComponent', () => {
  let fixture: ComponentFixture<SidebarComponent>;
  let component: SidebarComponent;
  let mockRoleService: any;
  let router: Router;

  beforeEach(async () => {
    mockRoleService = {
      isAdmin: jasmine.createSpy('isAdmin').and.returnValue(true)
    };

    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        provideRouter([]),
        { provide: RoleService, useValue: mockRoleService },
        ...provideMsalMocks()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create and set isAdmin signal', () => {
    expect(component).toBeTruthy();
    expect(component.isAdmin()).toBe(true);
  });

  it('should return employee nav items when not in admin path', () => {
    expect(component.navItems.length).toBe(3);
    expect(component.portalTitle).toBe('PeopleCore Portal');
  });

  it('should return admin nav items when in admin path', () => {
    spyOnProperty(router, 'url', 'get').and.returnValue('/admin/dashboard');
    expect(component.isAdminMode).toBe(true);
    expect(component.portalTitle).toBe('PeopleCore Admin');
    expect(component.navItems.length).toBe(4);
  });

  it('should trigger logout', () => {
    component.logout();
    expect(mockMsalService.logoutRedirect).toHaveBeenCalled();
  });
});
