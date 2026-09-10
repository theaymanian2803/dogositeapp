export function resolveClient<T extends { slug: string }>(
  clients: Record<string, T>,
  slug: string | undefined,
): T {
  const fallbackKey = Object.keys(clients)[0];
  return (slug && clients[slug]) || clients[fallbackKey];
}
