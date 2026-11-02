export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

export function isMinLength(value, min = 6) {
  return String(value || '').trim().length >= min;
}
