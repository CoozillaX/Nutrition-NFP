import { Timestamp } from "firebase-admin/firestore";

/**
 * Format a Firestore Timestamp to a human-readable string.
 * @param timestamp Firestore Timestamp
 * @returns Formatted date string
 */
function formatDate(timestamp: Timestamp): string {
  if (!timestamp) return "-";
  const date = timestamp.toDate();
  return date.toLocaleString("en-AU", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export { formatDate };
