export const FREE_SHIPPING_THRESHOLD = 500;
export const SHIPPING_FEE = 50;

export function shippingFor(
  subtotal: number,
  opts?: { threshold?: number; fee?: number },
): number {
  const threshold = opts?.threshold ?? FREE_SHIPPING_THRESHOLD;
  const fee = opts?.fee ?? SHIPPING_FEE;
  return subtotal > threshold || subtotal === 0 ? 0 : fee;
}