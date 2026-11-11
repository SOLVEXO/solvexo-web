/** A wa.me chat link: digits only with the country code (Pakistani 03… numbers become 923…). Null when there is no number. */
export function whatsappHref(number: string, text?: string): string | null {
  let d = number.replace(/\D/g, '');
  if (!d) return null;
  if (d.startsWith('00')) d = d.slice(2);
  else if (d.startsWith('0')) d = `92${d.slice(1)}`;
  return `https://wa.me/${d}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}
