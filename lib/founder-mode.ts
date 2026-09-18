// lib/founder-mode.ts

export function canUseFounderMode(
  email?: string | null,
) {
  const founderModeEnabled =
    process.env.CLIENTEYA_FOUNDER_MODE ===
    "true";

  if (!founderModeEnabled) {
    return false;
  }

  const rawEmails =
    process.env
      .CLIENTEYA_FOUNDER_EMAILS || "";

  const allowedEmails =
    rawEmails
      .split(",")
      .map((item) =>
        item
          .trim()
          .toLowerCase(),
      )
      .filter(Boolean);

  if (
    allowedEmails.length === 0
  ) {
    return false;
  }

  if (!email) {
    return false;
  }

  const normalizedEmail =
    email
      .trim()
      .toLowerCase();

  return allowedEmails.includes(
    normalizedEmail,
  );
}