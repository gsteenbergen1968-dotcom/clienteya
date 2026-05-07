const ADMIN_EMAILS = [
  "gsteenbergen1968@gmail.com",
];

export function isAdminEmail(email: string | null | undefined) {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
}