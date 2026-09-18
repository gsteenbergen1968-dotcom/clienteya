const STORAGE_KEY = "clienteya-onboarding-completed";

export function isFirstLaunch(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return localStorage.getItem(STORAGE_KEY) !== "true";
}

export function completeOnboarding(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(STORAGE_KEY, "true");
}

export function resetOnboarding(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(STORAGE_KEY);
}