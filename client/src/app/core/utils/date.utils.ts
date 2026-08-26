/**
 * Formats an ISO date string or Date object into a readable format: "DD MMM YYYY"
 * Example: "2026-06-20T00:00:00.000Z" -> "20 Jun 2026"
 */
export function beautifyDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return 'N/A';

  const date = new Date(dateInput);
  if (isNaN(date.getTime())) {
    return String(dateInput);
  }

  const day = String(date.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}
