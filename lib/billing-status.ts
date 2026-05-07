export type BillingStatus =
  | "trial"
  | "pending_review"
  | "active"
  | "canceled";

export function normalizeBillingStatus(
  value: string | null | undefined
): BillingStatus {
  if (value === "active") return "active";
  if (value === "pending_review") return "pending_review";
  if (value === "canceled") return "canceled";
  return "trial";
}

export function getBillingStatusLabel(status: string | null | undefined) {
  const normalized = normalizeBillingStatus(status);

  if (normalized === "active") return "Activa";
  if (normalized === "pending_review") return "En revisión";
  if (normalized === "canceled") return "Pausada";
  return "Trial";
}

export function getBillingStatusClasses(status: string | null | undefined) {
  const normalized = normalizeBillingStatus(status);

  if (normalized === "active") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (normalized === "pending_review") {
    return "bg-sky-100 text-sky-700";
  }

  if (normalized === "canceled") {
    return "bg-red-100 text-red-700";
  }

  return "bg-amber-100 text-amber-700";
}

export function canUploadPaymentProof(status: string | null | undefined) {
  const normalized = normalizeBillingStatus(status);

  return (
    normalized === "trial" ||
    normalized === "canceled" ||
    normalized === "pending_review"
  );
}

export function shouldShowReviewBox(status: string | null | undefined) {
  return normalizeBillingStatus(status) === "pending_review";
}

export function isAccountActive(status: string | null | undefined) {
  return normalizeBillingStatus(status) === "active";
}