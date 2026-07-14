import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { RoleService } from '../../../core/services/role.service';
import { provideMsalMocks } from '../../../testing/msal.mock';
import { ShellComponent } from './shell.component';

describe('ShellComponent', () => {
  let fixture: ComponentFixture<ShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShellComponent, RouterModule.forRoot([])],
      providers: [
        ...provideMsalMocks(),
        { provide: RoleService, useValue: { isAdmin: jest.fn().mockReturnValue(true) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();
  });

  it('should create the shell layout', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-sidebar')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('main.shell-content')).toBeTruthy();
  });
});
