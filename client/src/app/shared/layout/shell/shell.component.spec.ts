import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ShellComponent } from './shell.component';
import { provideMsalMocks } from '../../../testing/msal.mock';
import { ApiService } from '../../../services/api.service';
import { of } from 'rxjs';

describe('ShellComponent', () => {
  let mockApi: any;

  beforeEach(async () => {
    mockApi = {
      getProfile: jasmine.createSpy('getProfile').and.returnValue(of({ role: 'Admin' }))
    };

    await TestBed.configureTestingModule({
      imports: [ShellComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ApiService, useValue: mockApi },
        ...provideMsalMocks()
      ]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ShellComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
