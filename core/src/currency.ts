export function formatPrice(value: number | string): string {
  return `${Number(value).toFixed(2)} MAD`;
}