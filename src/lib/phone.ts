// src/lib/phone.ts

/**
 * Normalize phone number to E.164 format
 * Simple validation and formatting for international phone numbers
 */
export function normalizePhoneE164(phone: string): string | null {
  // Remove all spaces, dashes, parentheses, and dots
  let cleaned = phone.replace(/[\s\-\(\)\.\+]/g, '');
  
  // Handle Mexican mobile numbers specifically
  if (cleaned.length === 10 && /^[0-9]{10}$/.test(cleaned)) {
    // Mexican 10-digit mobile number, add country code +521
    cleaned = '521' + cleaned;
  } else if (cleaned.startsWith('52') && cleaned.length === 12) {
    // Already has +52, check if it needs the mobile "1"
    const afterCountryCode = cleaned.slice(2);
    if (afterCountryCode.length === 10 && /^[0-9]{10}$/.test(afterCountryCode)) {
      // This is a mobile number, needs the "1"
      cleaned = '521' + afterCountryCode;
    }
  } else if (cleaned.startsWith('521') && cleaned.length === 13) {
    // Already correctly formatted Mexican mobile
    // Do nothing
  }
  
  // Add + prefix
  const e164 = '+' + cleaned;
  
  // Basic validation: should be between 10-15 digits after +
  if (!/^\+[1-9]\d{9,14}$/.test(e164)) {
    return null;
  }
  
  return e164;
}

/**
 * Validate if string is a valid E.164 phone number
 */
export function isValidE164(phone: string): boolean {
  return /^\+[1-9]\d{9,14}$/.test(phone);
}

/**
 * Format phone number for display
 */
export function formatPhoneDisplay(phone: string): string {
  if (!phone.startsWith('+')) return phone;
  
  // For Mexican mobile numbers (+521...)
  if (phone.startsWith('+521')) {
    const number = phone.slice(4);
    if (number.length === 10) {
      return `+52 1 ${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6)}`;
    }
  }
  
  // For Mexican landline numbers (+52...)
  if (phone.startsWith('+52') && !phone.startsWith('+521')) {
    const number = phone.slice(3);
    if (number.length === 10) {
      return `+52 ${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6)}`;
    }
  }
  
  // For US numbers (+1...)
  if (phone.startsWith('+1')) {
    const number = phone.slice(2);
    if (number.length === 10) {
      return `+1 (${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6)}`;
    }
  }
  
  // Default formatting
  return phone;
}