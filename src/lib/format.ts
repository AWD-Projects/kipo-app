/**
 * Formatting utilities for Mexican Peso (MXN) currency
 * Provides consistent number and currency formatting throughout the app
 */

/**
 * Formats a number as Mexican Pesos with proper locale formatting
 * Example: 1234.56 -> "$1,234.56"
 */
export function formatCurrency(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) return '$0.00';

  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
}

/**
 * Formats a number for display without currency symbol
 * Useful for input fields and calculations
 * Example: 1234.56 -> "1,234.56"
 */
export function formatNumber(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) return '0.00';

  return new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);
}

/**
 * Parses a formatted Mexican Peso string to a number
 * Handles various input formats: "$1,234.56", "1,234.56", "1234.56"
 */
export function parseCurrency(value: string): number {
  if (!value) return 0;

  // Remove currency symbols, spaces, and commas
  const cleaned = value
    .replace(/[$\s,]/g, '')
    .replace(/[^\d.-]/g, '');

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Formats input value as user types for better UX
 * Maintains cursor position and handles decimal places
 */
export function formatInputCurrency(value: string): string {
  // Remove non-numeric characters except decimal point
  let cleaned = value.replace(/[^\d.]/g, '');

  // Ensure only one decimal point
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('');
  }

  // Limit to 2 decimal places
  if (parts.length === 2 && parts[1].length > 2) {
    cleaned = parts[0] + '.' + parts[1].substring(0, 2);
  }

  // Add thousand separators to integer part
  if (parts[0]) {
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    cleaned = parts.length === 2 ? `${integerPart}.${parts[1]}` : integerPart;
  }

  return cleaned;
}

/**
 * Validates if a string is a valid currency amount
 */
export function isValidCurrencyInput(value: string): boolean {
  const cleaned = value.replace(/[$\s,]/g, '');
  const regex = /^\d+(\.\d{0,2})?$/;
  return regex.test(cleaned);
}

/**
 * Formats large numbers with K, M notation for compact display
 * Example: 1234567 -> "$1.23M"
 */
export function formatCompactCurrency(amount: number): string {
  if (Math.abs(amount) < 1000) {
    return formatCurrency(amount);
  }

  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (absAmount >= 1000000) {
    return `${sign}$${(absAmount / 1000000).toFixed(2)}M`;
  }

  return `${sign}$${(absAmount / 1000).toFixed(2)}K`;
}