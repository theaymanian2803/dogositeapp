export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function productSlug(name: string): string {
  return `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`;
}