/**
 * UK Locale Formatting Utilities
 *
 * All dates, times, and currency values in the Operyx Kitchen Pro application
 * must be formatted according to UK standards:
 * - Dates: DD/MM/YYYY
 * - Times: GMT (no timezone conversion)
 * - Currency: GBP (£)
 *
 * These functions are the single source of truth for formatting.
 * DO NOT use toLocaleString() or other formatting methods directly in components.
 */

/**
 * Format a date as DD/MM/YYYY (UK format).
 * @param date - The date to format (Date object, ISO string, or timestamp)
 * @returns The formatted date string, e.g., "27/01/2026"
 */
export function formatDate(date: Date | string | number): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return "Invalid Date";
  }
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format a date and time as DD/MM/YYYY HH:MM (UK format, GMT).
 * @param date - The date to format (Date object, ISO string, or timestamp)
 * @returns The formatted date and time string, e.g., "27/01/2026 14:30"
 */
export function formatDateTime(date: Date | string | number): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return "Invalid Date";
  }
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();
  const hours = String(d.getUTCHours()).padStart(2, "0");
  const minutes = String(d.getUTCMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Format a time as HH:MM (GMT).
 * @param date - The date to format (Date object, ISO string, or timestamp)
 * @returns The formatted time string, e.g., "14:30"
 */
export function formatTime(date: Date | string | number): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return "Invalid Time";
  }
  const hours = String(d.getUTCHours()).padStart(2, "0");
  const minutes = String(d.getUTCMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Format a currency value as GBP (£).
 * @param value - The numeric value to format
 * @returns The formatted currency string, e.g., "£1,250.00"
 */
export function formatCurrency(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) {
    return "£0.00";
  }
  return `£${num.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format a number with UK-style thousands separators.
 * @param value - The numeric value to format
 * @returns The formatted number string, e.g., "1,250"
 */
export function formatNumber(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) {
    return "0";
  }
  return num.toLocaleString("en-GB");
}

/**
 * Parse a UK-formatted date string (DD/MM/YYYY) into a Date object.
 * @param dateString - The date string to parse
 * @returns A Date object, or null if parsing fails
 */
export function parseUKDate(dateString: string): Date | null {
  const parts = dateString.split("/");
  if (parts.length !== 3) {
    return null;
  }
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Months are 0-indexed
  const year = parseInt(parts[2], 10);
  if (isNaN(day) || isNaN(month) || isNaN(year)) {
    return null;
  }
  const date = new Date(Date.UTC(year, month, day));
  if (isNaN(date.getTime())) {
    return null;
  }
  return date;
}
