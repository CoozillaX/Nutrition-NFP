/**
 * Format a Date object into a human-readable string.
 * @param date - The Date object to format.
 * @returns A formatted date string in "en-AU" locale.
 */
function formatDate(date: Date) {
  return date.toLocaleString("en-AU", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export { formatDate };
