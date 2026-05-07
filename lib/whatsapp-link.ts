export function normalizeParaguayPhone(phone: string): string {
  let clean = String(phone || "").replace(/\D/g, "");

  if (!clean) return "";

  if (clean.startsWith("00")) {
    clean = clean.slice(2);
  }

  if (clean.startsWith("595")) {
    return clean;
  }

  if (clean.startsWith("0")) {
    return `595${clean.slice(1)}`;
  }

  return `595${clean}`;
}

export function buildWhatsAppLink(phone: string, message: string): string {
  const normalizedPhone = normalizeParaguayPhone(phone);
  const encodedMessage = encodeURIComponent(message || "");

  return `https://wa.me/${normalizedPhone}?text=${encodedMessage}`;
}