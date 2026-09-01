import { BeautifulDatePipe } from './beautiful-date.pipe';

describe('BeautifulDatePipe Unit Tests', () => {
  let pipe: BeautifulDatePipe;

  beforeEach(() => {
    pipe = new BeautifulDatePipe();
  });

  it('should transform date string into formatted date', () => {
    expect(pipe.transform('2026-05-10')).toBe('10 May 2026');
  });

  it('should return input or N/A for null or invalid dates', () => {
    expect(pipe.transform(null)).toBe('N/A');
    expect(pipe.transform('invalid')).toBe('invalid');
  });
});
