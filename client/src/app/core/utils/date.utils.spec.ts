import { beautifyDate } from './date.utils';

describe('date.utils Unit Tests', () => {
  it('should return N/A for null/undefined/empty input', () => {
    expect(beautifyDate(null)).toBe('N/A');
    expect(beautifyDate(undefined)).toBe('N/A');
    expect(beautifyDate('')).toBe('N/A');
  });

  it('should return raw input string for invalid dates', () => {
    expect(beautifyDate('invalid-date-string')).toBe('invalid-date-string');
  });

  it('should format valid ISO dates and Date objects correctly', () => {
    expect(beautifyDate('2026-06-20T00:00:00.000Z')).toBe('20 Jun 2026');
    expect(beautifyDate(new Date(2026, 0, 15))).toBe('15 Jan 2026');
  });
});
