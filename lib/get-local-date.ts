/**
 * Gets the current date in the user's local timezone as YYYY-MM-DD string.
 * This ensures problems are released at midnight local time for each user.
 */
export function getLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
