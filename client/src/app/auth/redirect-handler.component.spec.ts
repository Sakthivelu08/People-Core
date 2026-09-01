import { TestBed } from '@angular/core/testing';
import { RedirectHandlerComponent } from './redirect-handler.component';
import { provideMsalMocks } from '../testing/msal.mock';

describe('RedirectHandlerComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RedirectHandlerComponent],
      providers: [...provideMsalMocks()]
    }).compileComponents();
  });

  it('should create redirect handler component', () => {
    const fixture = TestBed.createComponent(RedirectHandlerComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
