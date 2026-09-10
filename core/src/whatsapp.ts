export function waLinkFrom(rawNumber: string, text: string): string | null {
  const number = rawNumber.replace(/[^0-9]/g, "");
  if (!number) return null;
  const waNumber = number.startsWith("0") ? `212${number.replace(/^0/, "")}` : number;
  return `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;
}