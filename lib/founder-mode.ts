// lib/founder-mode.ts

export function canUseFounderMode(email?: string | null) {
  const isDevelopment = process.env.NODE_ENV === "development";

  if (!isDevelopment) {
    return false;
  }

  // Alleen expliciet uitzetten als dit op false staat
  if (process.env.CLIENTEYA_FOUNDER_MODE === "false") {
    return false;
  }

  const rawEmails = process.env.CLIENTEYA_FOUNDER_EMAILS || "";

  const allowedEmails = rawEmails
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  // Geen emails ingesteld = lokale founder/dev toegang
  if (allowedEmails.length === 0) {
    return true;
  }

  if (!email) {
    return false;
  }

  return allowedEmails.includes(email.toLowerCase());
}