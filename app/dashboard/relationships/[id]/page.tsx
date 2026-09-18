import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { AppHeader } from "../../../components/AppHeader";
import SectionCard from "../../../components/SectionCard";
import MobileDashboardNav from "../../MobileDashboardNav";
import SidebarNav from "../../SidebarNav";
import PageHeader from "../../components/PageHeader";

import { createRelationshipService } from "../../../../lib/relationship-service";
import { createAuthServerClient } from "../../../../lib/supabase/auth-server";
import { ui } from "../../../../lib/ui";

export const dynamic = "force-dynamic";

type RelationshipDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type RelationshipDetailRecord = {
  id: string;
  owner_id?: string | null;
  name?: string | null;
  company?: string | null;
  phone?: string | null;
  email?: string | null;
  relationship_type?: string | null;
  status?: string | null;
  notes?: string | null;
  reminder?: string | null;
  next_contact_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;

  expected_amount?: number | null;
  paid_amount?: number | null;
  currency?: "PYG" | "USD" | null;
  paid_at?: string | null;
  invoice_number?: string | null;
  payment_description?: string | null;
};

function formatDate(
  value: string | null | undefined,
): string {
  if (!value) return "—";

  const clean = value.slice(0, 10);
  const [year, month, day] = clean.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

function formatAmount(
  value: number | null | undefined,
  currency: "PYG" | "USD" | null | undefined,
): string {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(Number(value))
  ) {
    return "—";
  }

  const amount = Number(value);

  if (currency === "USD") {
    return new Intl.NumberFormat("es-PY", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(amount);
  }

  return `Gs. ${new Intl.NumberFormat("es-PY", {
    maximumFractionDigits: 0,
  }).format(amount)}`;
}

function normalizePhone(
  value: string | null | undefined,
): string {
  return String(value ?? "").replace(/\D/g, "");
}

function getWhatsAppHref(
  phone: string | null | undefined,
): string | null {
  const raw = normalizePhone(phone);

  if (!raw) return null;

  let number = raw;

  if (number.startsWith("00")) {
    number = number.slice(2);
  }

  if (number.startsWith("0")) {
    number = number.slice(1);
  }

  if (!number.startsWith("595")) {
    number = `595${number}`;
  }

  return `https://wa.me/${number}`;
}

function normalizeRelationshipType(
  value: string | null | undefined,
): string {
  return String(value ?? "").trim().toLowerCase();
}

function getStatusClasses(
  status: string | null,
): string {
  const value =
    status?.trim().toLowerCase() ?? "";

  if (value.includes("pag")) {
    return "border-emerald-200 bg-emerald-100 text-emerald-700";
  }

  if (value.includes("interes")) {
    return "border-amber-200 bg-amber-100 text-amber-700";
  }

  if (value.includes("contact")) {
    return "border-blue-200 bg-blue-100 text-blue-700";
  }

  if (value.includes("cerr")) {
    return "border-red-200 bg-red-100 text-red-700";
  }

  return "border-slate-200 bg-slate-100 text-slate-700";
}

function getTodayInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseOptionalAmount(
  value: FormDataEntryValue | null,
): number | null {
  const raw = String(value ?? "").trim();

  if (!raw) {
    return null;
  }

  const amount = Number(raw);

  if (
    !Number.isFinite(amount) ||
    amount < 0
  ) {
    throw new Error("Importe inválido.");
  }

  return amount;
}

function normalizeOptionalText(
  value: FormDataEntryValue | null,
): string | null {
  const normalized =
    String(value ?? "").trim();

  return normalized || null;
}

function DetailTile({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-semibold leading-6 text-slate-700">
        {value}
      </p>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </label>

      {children}
    </div>
  );
}

export default async function RelationshipDetailPage({
  params,
}: RelationshipDetailPageProps) {
  const { id } = await params;

  const auth =
    await createAuthServerClient();

  const {
    data: { user },
  } =
    await auth.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const {
    data: relationshipData,
    error: relationshipError,
  } =
    await auth
      .from("relationships")
      .select("*")
      .eq("id", id)
      .eq("owner_id", user.id)
      .maybeSingle();

  if (
    relationshipError ||
    !relationshipData
  ) {
    return (
      <div className="dashboard-shell">
        <AppHeader />

        <main className="dashboard-main">
          <div className="flex min-h-screen bg-slate-50/60">
            <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
              <SidebarNav />
            </aside>

            <div className="min-w-0 flex-1 px-4 pb-36 pt-5 sm:px-6 lg:px-10 lg:pb-10 lg:pt-8">
              <div className="mx-auto w-full max-w-[1100px]">
                <SectionCard
                  badge="ClienteYA"
                  title="Relación no encontrada"
                  description="Esta relación no pertenece a tu cuenta o ya no existe."
                >
                  <Link
                    href="/dashboard/relationships"
                    className={ui.buttons.primary}
                  >
                    Volver a relaciones
                  </Link>
                </SectionCard>
              </div>
            </div>
          </div>
        </main>

        <div className="lg:hidden">
          <MobileDashboardNav />
        </div>
      </div>
    );
  }

  const relationship =
    relationshipData as RelationshipDetailRecord;

  const relationshipType =
    relationship.relationship_type?.trim() ||
    null;

  const isSupplier =
    normalizeRelationshipType(
      relationshipType,
    ) === "proveedor";

  async function markAsContacted() {
    "use server";

    const auth =
      await createAuthServerClient();

    const {
      data: { user },
    } =
      await auth.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const service =
      createRelationshipService();

    await service.markAsContacted(
      id,
      user.id,
    );

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/relationships");
    revalidatePath(`/dashboard/relationships/${id}`);
    revalidatePath("/dashboard/planning");
    revalidatePath("/dashboard/cockpit");

    redirect(`/dashboard/relationships/${id}`);
  }

  async function scheduleForTomorrow() {
    "use server";

    const auth =
      await createAuthServerClient();

    const {
      data: { user },
    } =
      await auth.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const service =
      createRelationshipService();

    await service.scheduleForTomorrow(
      id,
      user.id,
    );

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/relationships");
    revalidatePath(`/dashboard/relationships/${id}`);
    revalidatePath("/dashboard/planning");
    revalidatePath("/dashboard/cockpit");

    redirect(`/dashboard/relationships/${id}`);
  }

  async function savePayment(
    formData: FormData,
  ) {
    "use server";

    const auth =
      await createAuthServerClient();

    const {
      data: { user },
    } =
      await auth.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const service =
      createRelationshipService();

    const currentRelationship =
      await service.getRelationship(
        id,
        user.id,
      );

    if (!currentRelationship) {
      redirect("/dashboard/relationships");
    }

    const supplier =
      normalizeRelationshipType(
        currentRelationship.relationship_type,
      ) === "proveedor";

    const expectedAmount =
      parseOptionalAmount(
        formData.get("expected_amount"),
      );

    const paidAmount =
      parseOptionalAmount(
        formData.get("paid_amount"),
      );

    if (paidAmount === null) {
      throw new Error(
        supplier
          ? "El importe pagado al proveedor es obligatorio."
          : "El importe pagado es obligatorio.",
      );
    }

    const currencyValue =
      String(
        formData.get("currency") ||
          "PYG",
      );

    const currency:
      "PYG" | "USD" =
        currencyValue === "USD"
          ? "USD"
          : "PYG";

    const paidAtInput =
      normalizeOptionalText(
        formData.get("paid_at"),
      );

    const invoiceNumber =
      normalizeOptionalText(
        formData.get("invoice_number"),
      );

    const paymentDescription =
      normalizeOptionalText(
        formData.get("payment_description"),
      );

    const paidAt =
      paidAtInput
        ? `${paidAtInput}T12:00:00.000Z`
        : new Date().toISOString();

    if (supplier) {
      await service.updateRelationship(
        id,
        user.id,
        {
          expected_amount:
            expectedAmount,
          paid_amount:
            paidAmount,
          currency,
          paid_at:
            paidAt,
          invoice_number:
            invoiceNumber,
          payment_description:
            paymentDescription,
        },
      );
    } else {
      await service.updateRelationship(
        id,
        user.id,
        {
          expected_amount:
            expectedAmount,
        },
      );

      await service.markAsPaid(
        id,
        user.id,
        {
          paid_amount:
            paidAmount,
          currency,
          paid_at:
            paidAt,
          invoice_number:
            invoiceNumber,
          payment_description:
            paymentDescription,
        },
      );
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/relationships");
    revalidatePath(`/dashboard/relationships/${id}`);
    revalidatePath(`/dashboard/edit?id=${id}`);
    revalidatePath("/dashboard/planning");
    revalidatePath("/dashboard/cockpit");
    revalidatePath("/dashboard/whatsapp");

    redirect(`/dashboard/relationships/${id}`);
  }

  const name =
    relationship.name?.trim() ||
    "Relación sin nombre";

  const company =
    relationship.company?.trim() ||
    null;

  const status =
    relationship.status?.trim() ||
    "Nuevo";

  const currency =
    relationship.currency === "USD"
      ? "USD"
      : "PYG";

  const whatsappHref =
    getWhatsAppHref(
      relationship.phone,
    );

  const isPaid =
    !isSupplier &&
    status.toLowerCase().includes("pag");

  const hasSupplierPayment =
    isSupplier &&
    (
      (
        relationship.paid_amount !== null &&
        relationship.paid_amount !== undefined
      ) ||
      Boolean(relationship.paid_at)
    );

  const paymentSectionBadge =
    isSupplier
      ? "Proveedor"
      : "Comercial";

  const paymentSectionTitle =
    isSupplier
      ? "Pagos al proveedor"
      : "Información de pago";

  const paymentSectionDescription =
    isSupplier
      ? "Importes previstos y pagos realizados a este proveedor."
      : "Valor esperado y pago real de esta relación.";

  const expectedAmountLabel =
    isSupplier
      ? "Importe previsto"
      : "Valor esperado";

  const paidAmountLabel =
    isSupplier
      ? "Pagado al proveedor"
      : "Importe pagado";

  const paymentFormTitle =
    isSupplier
      ? (
          hasSupplierPayment
            ? "Actualizar pago al proveedor"
            : "Registrar pago al proveedor"
        )
      : (
          isPaid
            ? "Actualizar pago"
            : "Registrar pago"
        );

  const paymentFormDescription =
    isSupplier
      ? "Registra lo que pagaste a este proveedor sin cambiar su estado comercial."
      : "Registra el importe real recibido. Esta información pertenece a la relación y no a la suscripción de ClienteYA.";

  const paymentButtonLabel =
    isSupplier
      ? (
          hasSupplierPayment
            ? "Guardar pago al proveedor"
            : "Registrar pago al proveedor"
        )
      : (
          isPaid
            ? "Guardar información de pago"
            : "Registrar como pagada"
        );

  return (
    <div className="dashboard-shell">
      <AppHeader />

      <main className="dashboard-main">
        <div className="flex min-h-screen bg-slate-50/60">
          <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
            <SidebarNav />
          </aside>

          <div className="min-w-0 flex-1 px-4 pb-40 pt-5 sm:px-6 lg:px-10 lg:pb-10 lg:pt-8">
            <div className="mx-auto w-full max-w-[1180px]">
              <PageHeader
                badge="ClienteYA · Relaciones"
                title={name}
                description={
                  company
                    ? `${company} · Contexto y seguimiento comercial.`
                    : "Contexto y seguimiento comercial."
                }
              />

              <section className="mt-5 overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                <div className="bg-gradient-to-br from-blue-50 via-white to-slate-50 p-5 sm:p-7">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {relationshipType ? (
                          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-600">
                            {relationshipType}
                          </span>
                        ) : null}

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusClasses(
                            relationship.status ?? null,
                          )}`}
                        >
                          {status}
                        </span>

                        {isPaid ? (
                          <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-black text-emerald-700">
                            {formatAmount(
                              relationship.paid_amount,
                              currency,
                            )}
                          </span>
                        ) : null}

                        {hasSupplierPayment ? (
                          <span className="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-black text-blue-700">
                            Pagado al proveedor:{" "}
                            {formatAmount(
                              relationship.paid_amount,
                              currency,
                            )}
                          </span>
                        ) : null}
                      </div>

                      <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
                        {name}
                      </h1>

                      {company ? (
                        <p className="mt-2 text-sm font-black text-blue-700">
                          {company}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {whatsappHref ? (
                        <a
                          href={whatsappHref}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700"
                        >
                          WhatsApp
                        </a>
                      ) : null}

                      <Link
                        href={`/dashboard/edit?id=${relationship.id}`}
                        className={ui.buttons.secondary}
                      >
                        Editar
                      </Link>

                      <Link
                        href="/dashboard/relationships"
                        className={ui.buttons.secondary}
                      >
                        Volver
                      </Link>
                    </div>
                  </div>
                </div>
              </section>

              <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_0.72fr]">
                <div className="space-y-5">
                  <SectionCard
                    badge="Contexto"
                    title="Información de la relación"
                    description="Datos centrales para mantener el seguimiento."
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <DetailTile
                        label="Tipo de relación"
                        value={
                          relationshipType ||
                          "Sin tipo definido"
                        }
                      />

                      <DetailTile
                        label="Teléfono"
                        value={
                          relationship.phone ||
                          "Sin teléfono"
                        }
                      />

                      <DetailTile
                        label="Correo"
                        value={
                          relationship.email ||
                          "Sin correo"
                        }
                      />

                      <DetailTile
                        label="Próximo contacto"
                        value={formatDate(
                          relationship.next_contact_at,
                        )}
                      />

                      <DetailTile
                        label="Creado"
                        value={formatDate(
                          relationship.created_at,
                        )}
                      />
                    </div>

                    <div className="mt-3 rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                        Notas
                      </p>

                      <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-700">
                        {relationship.notes ||
                          "Sin notas todavía."}
                      </p>
                    </div>

                    <div className="mt-3 rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                        Recordatorio
                      </p>

                      <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-700">
                        {relationship.reminder ||
                          "Sin recordatorio activo."}
                      </p>
                    </div>
                  </SectionCard>

                  <SectionCard
                    badge={paymentSectionBadge}
                    title={paymentSectionTitle}
                    description={paymentSectionDescription}
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <DetailTile
                        label={expectedAmountLabel}
                        value={formatAmount(
                          relationship.expected_amount,
                          currency,
                        )}
                      />

                      <DetailTile
                        label={paidAmountLabel}
                        value={formatAmount(
                          relationship.paid_amount,
                          currency,
                        )}
                      />

                      <DetailTile
                        label="Moneda"
                        value={
                          currency === "USD"
                            ? "USD"
                            : "PYG · Guaraníes"
                        }
                      />

                      <DetailTile
                        label="Fecha de pago"
                        value={formatDate(
                          relationship.paid_at,
                        )}
                      />

                      <DetailTile
                        label="Factura"
                        value={
                          relationship.invoice_number ||
                          "—"
                        }
                      />

                      <DetailTile
                        label="Concepto"
                        value={
                          relationship.payment_description ||
                          "—"
                        }
                      />
                    </div>
                  </SectionCard>
                </div>

                <div className="space-y-5">
                  <SectionCard
                    badge="Acción"
                    title="Siguiente paso"
                    description="Actualiza la relación sin salir del detalle."
                  >
                    <div className="grid gap-3">
                      <form action={markAsContacted}>
                        <button className="w-full rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-700">
                          Marcar como contactada
                        </button>
                      </form>

                      <form action={scheduleForTomorrow}>
                        <button className="w-full rounded-2xl bg-amber-500 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-amber-600">
                          Programar para mañana
                        </button>
                      </form>
                    </div>
                  </SectionCard>

                  <SectionCard
                    badge={isSupplier ? "Proveedor" : "Pago"}
                    title={paymentFormTitle}
                    description={paymentFormDescription}
                  >
                    <form
                      action={savePayment}
                      className="space-y-4"
                    >
                      <div className="grid gap-4 sm:grid-cols-2">
                        <FormField label={expectedAmountLabel}>
                          <input
                            type="number"
                            name="expected_amount"
                            min="0"
                            step={
                              currency === "USD"
                                ? "0.01"
                                : "1"
                            }
                            defaultValue={
                              relationship.expected_amount ??
                              ""
                            }
                            placeholder="0"
                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500"
                          />
                        </FormField>

                        <FormField label={paidAmountLabel}>
                          <input
                            type="number"
                            name="paid_amount"
                            min="0"
                            step={
                              currency === "USD"
                                ? "0.01"
                                : "1"
                            }
                            required
                            defaultValue={
                              relationship.paid_amount ??
                              ""
                            }
                            placeholder="0"
                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500"
                          />
                        </FormField>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <FormField label="Moneda">
                          <select
                            name="currency"
                            defaultValue={currency}
                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500"
                          >
                            <option value="PYG">
                              PYG · Guaraníes
                            </option>

                            <option value="USD">
                              USD · Dólares
                            </option>
                          </select>
                        </FormField>

                        <FormField label="Fecha de pago">
                          <input
                            type="date"
                            name="paid_at"
                            defaultValue={
                              relationship.paid_at
                                ? relationship.paid_at.slice(
                                    0,
                                    10,
                                  )
                                : getTodayInputValue()
                            }
                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500"
                          />
                        </FormField>
                      </div>

                      <FormField label="Número de factura">
                        <input
                          type="text"
                          name="invoice_number"
                          defaultValue={
                            relationship.invoice_number ||
                            ""
                          }
                          placeholder="Opcional"
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500"
                        />
                      </FormField>

                      <FormField label="Concepto del pago">
                        <textarea
                          name="payment_description"
                          rows={3}
                          defaultValue={
                            relationship.payment_description ||
                            ""
                          }
                          placeholder={
                            isSupplier
                              ? "Ej. Compra de insumos"
                              : "Ej. Consultoría agosto"
                          }
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500"
                        />
                      </FormField>

                      <button className="w-full rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700">
                        {paymentButtonLabel}
                      </button>
                    </form>
                  </SectionCard>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <div className="lg:hidden">
        <MobileDashboardNav />
      </div>
    </div>
  );
}