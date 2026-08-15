
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

export function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, '');
}
const MIN_PHONE_DIGITS = 9;
const MAX_PHONE_DIGITS = 15;

export function isValidPhone(phone: string): boolean {
  const digits = digitsOnly(phone);
  return digits.length >= MIN_PHONE_DIGITS && digits.length <= MAX_PHONE_DIGITS;
}

export const EMAIL_ERROR_MESSAGE = 'Please enter a real, complete email address (e.g. name@example.com).';
export const PHONE_ERROR_MESSAGE = 'Please enter a valid phone number, including your country code (e.g. +254712345678).';