export function formatPrice(value: number | string, currency = "MAD"): string {
  return `${Number(value).toFixed(2)} ${currency}`;
}