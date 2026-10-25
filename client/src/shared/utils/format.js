export function formatCurrency(amount, locale = 'vi-VN', currency = 'VND') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(Number(amount || 0));
}

export function formatDate(dateInput, locale = 'vi-VN') {
  if (!dateInput) return '—';
  return new Intl.DateTimeFormat(locale).format(new Date(dateInput));
}
