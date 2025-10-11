/**
 * Date utilities to handle local dates without timezone conversion issues
 *
 * Problem: When using Date.toISOString(), JavaScript converts the date to UTC,
 * which can shift the date by a day depending on your timezone.
 *
 * Example:
 * - Selected: Oct 2, 2025 (00:00 in GMT-6)
 * - toISOString() converts to UTC: 2025-10-01T06:00:00.000Z
 * - Result: Wrong date! (Oct 1 instead of Oct 2)
 *
 * These utilities ensure dates are handled in local time without conversion.
 */

/**
 * Convert a Date object to local date string (YYYY-MM-DD) without timezone conversion
 * @param date - Date object to convert
 * @returns String in format YYYY-MM-DD (e.g., "2025-10-02")
 */
export function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse a date string as local date (avoiding timezone shifts)
 * @param dateString - Date string in format YYYY-MM-DD
 * @returns Date object set to local midnight
 */
export function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Format a date string for display in Spanish (Mexico)
 * @param dateString - Date string in format YYYY-MM-DD or ISO string
 * @returns Formatted date string (e.g., "2 de octubre de 2025")
 */
export function formatDateES(dateString: string): string {
  const date = parseLocalDate(dateString.split('T')[0]);
  if (isNaN(date.getTime())) {
    return 'Fecha no disponible';
  }
  return date.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Check if a date string is valid
 * @param dateString - Date string to validate
 * @returns true if valid, false otherwise
 */
export function isValidDateString(dateString: string | null | undefined): boolean {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}
