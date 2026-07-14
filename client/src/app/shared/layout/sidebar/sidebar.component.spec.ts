import { TestBed, ComponentFixture } from '@angular/core/testing';
import { SidebarComponent } from './sidebar.component';
import { RouterModule } from '@angular/router';
import { RoleService } from '../../../core/services/role.service';
import { provideMsalMocks, mockMsalService } from '../../../testing/msal.mock';

const mockRoleService = {
  isAdmin: jest.fn().mockReturnValue(true),
};

describe('SidebarComponent', () => {
  let fixture: ComponentFixture<SidebarComponent>;
  let component: SidebarComponent;

  beforeEach(async () => {
    jest.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [SidebarComponent, RouterModule.forRoot([])],
      providers: [
        ...provideMsalMocks(),
        { provide: RoleService, useValue: mockRoleService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set isAdmin true for admin user', () => {
    expect(component.isAdmin).toBe(true);
  });

  it('should show admin nav items when isAdmin', () => {
    expect(component.adminNavItems.length).toBeGreaterThan(0);
    expect(component.navItems).toEqual(component.allNavItems);
  });

  it('should show employee nav items', () => {
    expect(component.employeeNavItems.length).toBeGreaterThan(0);
  });

  it('should hide admin items for non-admin', () => {
    mockRoleService.isAdmin.mockReturnValue(false);
    component.ngOnInit();
    expect(component.isAdmin).toBe(false);
    expect(component.navItems.every(item => !item.adminOnly)).toBe(true);
  });

  it('should call logoutRedirect on logout()', () => {
    component.logout();
    expect(mockMsalService.logoutRedirect).toHaveBeenCalled();
  });
});
