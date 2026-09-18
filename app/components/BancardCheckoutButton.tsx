"use client";

type BancardPlan = "pro";

export type BancardBillingCycle =
  | "monthly"
  | "yearly";

export default function BancardCheckoutButton({
  plan,
  billingCycle = "monthly",
  label,
  available = false,
}: {
  plan: BancardPlan;
  billingCycle?: BancardBillingCycle;
  label: string;
  available?: boolean;
}) {
  async function startCheckout() {
    if (!available) {
      return;
    }

    const response =
      await fetch(
        "/api/bancard/create-checkout",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            plan,
            billingCycle,
          }),
        },
      );

    const data =
      await response.json();

    if (
      !response.ok ||
      !data.checkoutUrl
    ) {
      throw new Error(
        data.error ||
          "No se pudo iniciar el pago en este momento.",
      );
    }

    window.location.href =
      data.checkoutUrl;
  }

  return (
    <div>
      <button
        type="button"
        onClick={startCheckout}
        disabled={!available}
        className={`w-full rounded-2xl px-4 py-3 text-sm font-black shadow-sm transition ${
          available
            ? "bg-blue-700 text-white hover:bg-blue-800"
            : "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-500"
        }`}
      >
        {available
          ? label
          : "Pago disponible próximamente"}
      </button>

      {!available && (
        <p className="mt-3 text-center text-xs font-semibold leading-5 text-slate-500">
          La activación con Bancard estará disponible cuando finalice la
          configuración bancaria.
        </p>
      )}
    </div>
  );
}