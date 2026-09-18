import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAuthServerClient } from "../../../lib/supabase/auth-server";

import { AppHeader } from "../../components/AppHeader";
import SidebarNav from "../SidebarNav";

type RelationshipCurrency =
  | "PYG"
  | "USD";

function parseOptionalAmount(
  value: FormDataEntryValue | null,
): number | null {
  const raw =
    String(
      value ?? "",
    ).trim();

  if (!raw) {
    return null;
  }

  const amount =
    Number(raw);

  if (
    !Number.isFinite(amount) ||
    amount < 0
  ) {
    throw new Error(
      "Importe inválido.",
    );
  }

  return amount;
}

function normalizeOptionalText(
  value: FormDataEntryValue | null,
): string | null {
  const normalized =
    String(
      value ?? "",
    ).trim();

  return normalized || null;
}

export default async function NewRelationshipPage() {
  const supabase =
    await createAuthServerClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  async function createRelationship(
    formData: FormData,
  ) {
    "use server";

    const supabase =
      await createAuthServerClient();

    const {
      data: { user },
    } =
      await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const name = String(
      formData.get("name") || "",
    ).trim();

    const phone = String(
      formData.get("phone") || "",
    ).trim();

    const status = String(
      formData.get("status") || "Nuevo",
    ).trim();

    const nextContactAt = String(
      formData.get("next_contact_at") || "",
    ).trim();

    const reminder = String(
      formData.get("reminder") || "",
    ).trim();

    const notes = String(
      formData.get("notes") || "",
    ).trim();

    const email = String(
      formData.get("email") || "",
    ).trim();

    const company = String(
      formData.get("company") || "",
    ).trim();

    const relationshipType = String(
      formData.get("relationship_type") || "",
    ).trim();

    const birthday = String(
      formData.get("birthday") || "",
    ).trim();

    const expectedAmount =
      parseOptionalAmount(
        formData.get(
          "expected_amount",
        ),
      );

    const paidAmount =
      parseOptionalAmount(
        formData.get(
          "paid_amount",
        ),
      );

    const currencyValue =
      String(
        formData.get(
          "currency",
        ) ||
          "PYG",
      );

    const currency:
      RelationshipCurrency =
        currencyValue ===
        "USD"
          ? "USD"
          : "PYG";

    const paidAtInput =
      normalizeOptionalText(
        formData.get(
          "paid_at",
        ),
      );

    const invoiceNumber =
      normalizeOptionalText(
        formData.get(
          "invoice_number",
        ),
      );

    const paymentDescription =
      normalizeOptionalText(
        formData.get(
          "payment_description",
        ),
      );

    const isPaidStatus =
      status
        .toLowerCase()
        .includes("pag");

    if (
      isPaidStatus &&
      paidAmount === null
    ) {
      throw new Error(
        "El importe pagado es obligatorio cuando la relación está marcada como Pagó.",
      );
    }

    const paidAt =
      isPaidStatus
        ? (
            paidAtInput
              ? `${paidAtInput}T12:00:00.000Z`
              : new Date().toISOString()
          )
        : null;

    if (
      !name ||
      !phone
    ) {
      redirect(
        "/dashboard/new",
      );
    }

    const {
      error,
    } =
      await supabase
        .from("relationships")
        .insert({
          owner_id:
            user.id,
          name,
          company:
            company || null,
          phone,
          email:
            email || null,
          relationship_type:
            relationshipType || null,
          status,
          birthday:
            birthday || null,
          notes:
            notes || null,
          reminder:
            reminder || null,
          next_contact_at:
            nextContactAt || null,
          expected_amount:
            expectedAmount,
          paid_amount:
            isPaidStatus
              ? paidAmount
              : null,
          currency,
          paid_at:
            paidAt,
          invoice_number:
            isPaidStatus
              ? invoiceNumber
              : null,
          payment_description:
            isPaidStatus
              ? paymentDescription
              : null,
          updated_at:
            new Date().toISOString(),
        });

    if (error) {
      console.error(
        "RELATIONSHIP INSERT ERROR:",
        error,
      );

      redirect(
        "/dashboard/new",
      );
    }

    revalidatePath(
      "/dashboard",
    );

    revalidatePath(
      "/dashboard/relationships",
    );

    revalidatePath(
      "/dashboard/planning",
    );

    revalidatePath(
      "/dashboard/automations",
    );

    revalidatePath(
      "/dashboard/cockpit",
    );

    redirect(
      "/dashboard/relationships",
    );
  }

  return (
    <div className="dashboard-shell">
      <AppHeader />

      <main className="dashboard-main">
        <div className="flex min-h-screen bg-slate-50/60">
          <aside className="hidden w-72 border-r border-slate-200 bg-white lg:flex lg:flex-col">
            <SidebarNav />
          </aside>

          <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
            <div className="mx-auto max-w-7xl">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                    Nueva relación
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    Guarda lo esencial ahora. La relación puede enriquecerse
                    cuando tengas más contexto.
                  </p>
                </div>

                <a
                  href="/dashboard/relationships"
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Volver a relaciones
                </a>
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
                <form
                  action={createRelationship}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="mb-6">
                    <h2 className="text-2xl font-black text-slate-950">
                      Datos esenciales
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Añade sólo lo necesario para recordar la relación y
                      preparar el próximo paso.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Nombre
                      </label>

                      <input
                        name="name"
                        required
                        placeholder="Ej. María González"
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Teléfono
                      </label>

                      <input
                        name="phone"
                        required
                        inputMode="tel"
                        placeholder="Ej. 981123456"
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Estado
                      </label>

                      <select
                        name="status"
                        defaultValue="Nuevo"
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                      >
                        <option value="Nuevo">
                          Nueva
                        </option>

                        <option value="Interesado">
                          Interesada
                        </option>

                        <option value="Contactado">
                          Contactada
                        </option>

                        <option value="Pagó">
                          Convertida
                        </option>

                        <option value="Entregado">
                          Entregada
                        </option>

                        <option value="Cerrado">
                          Cerrada
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Próximo contacto
                      </label>

                      <input
                        type="date"
                        name="next_contact_at"
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Recordatorio
                    </label>

                    <input
                      name="reminder"
                      placeholder="Ej. Enviar propuesta el jueves"
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                    />
                  </div>

                  <div className="mt-4">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Notas
                    </label>

                    <textarea
                      name="notes"
                      rows={5}
                      placeholder="Escribe lo que no quieres olvidar de esta relación."
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                    />
                  </div>

                  <details className="mt-6 rounded-3xl border border-blue-200 bg-blue-50/40 p-5">
                    <summary className="cursor-pointer list-none">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-black text-blue-900">
                            Más información
                          </p>

                          <p className="mt-1 text-xs leading-5 text-blue-700">
                            Opcional. Añade contexto sólo cuando aporte valor.
                          </p>
                        </div>

                        <span className="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-black text-blue-700">
                          Abrir
                        </span>
                      </div>
                    </summary>

                    <div className="mt-5 grid gap-4 border-t border-blue-200 pt-5 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Correo electrónico
                        </label>

                        <input
                          type="email"
                          name="email"
                          placeholder="nombre@empresa.com"
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Empresa
                        </label>

                        <input
                          name="company"
                          placeholder="Ej. Empresa González"
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Tipo de relación
                        </label>

                        <select
                          name="relationship_type"
                          defaultValue=""
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                        >
                          <option value="">
                            Seleccionar
                          </option>

                          <option value="Prospecto">
                            Prospecto
                          </option>

                          <option value="Cliente">
                            Cliente
                          </option>

                          <option value="Socio">
                            Socio
                          </option>

                          <option value="Proveedor">
                            Proveedor
                          </option>

                          <option value="Inversor">
                            Inversor
                          </option>

                          <option value="Contacto de red">
                            Contacto de red
                          </option>

                          <option value="Embajador">
                            Embajador
                          </option>

                          <option value="Otro">
                            Otro
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Fecha de cumpleaños
                        </label>

                        <input
                          type="date"
                          name="birthday"
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                        />
                      </div>

                      <div className="md:col-span-2 rounded-[26px] border border-emerald-200 bg-emerald-50/60 p-4 sm:p-5">
                        <div className="mb-4">
                          <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                            Información comercial
                          </p>

                          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                            Registra el valor esperado y, si la relación ya está convertida, el importe real recibido.
                          </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                              Valor esperado
                            </label>

                            <input
                              type="number"
                              name="expected_amount"
                              min="0"
                              step="0.01"
                              placeholder="0"
                              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                              Importe pagado
                            </label>

                            <input
                              type="number"
                              name="paid_amount"
                              min="0"
                              step="0.01"
                              placeholder="0"
                              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                              Moneda
                            </label>

                            <select
                              name="currency"
                              defaultValue="PYG"
                              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                            >
                              <option value="PYG">
                                PYG · Guaraníes
                              </option>

                              <option value="USD">
                                USD · Dólares
                              </option>
                            </select>
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                              Fecha de pago
                            </label>

                            <input
                              type="date"
                              name="paid_at"
                              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                            />
                          </div>
                        </div>

                        <div className="mt-4">
                          <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Número de factura
                          </label>

                          <input
                            type="text"
                            name="invoice_number"
                            placeholder="Opcional"
                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                          />
                        </div>

                        <div className="mt-4">
                          <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Concepto del pago
                          </label>

                          <textarea
                            name="payment_description"
                            rows={3}
                            placeholder="Ej. Consultoría agosto"
                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </details>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      type="submit"
                      className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
                    >
                      Guardar relación
                    </button>

                    <a
                      href="/dashboard/relationships"
                      className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      Cancelar
                    </a>
                  </div>
                </form>

                <div className="space-y-6">
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">
                      ClienteYA
                    </p>

                    <h2 className="mt-3 text-2xl font-black text-slate-950">
                      Primero la relación
                    </h2>

                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      Guarda lo esencial en pocos segundos. El contexto puede
                      crecer después de cada conversación.
                    </p>
                  </div>

                  <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
                    <h2 className="text-xl font-black text-amber-900">
                      WhatsApp
                    </h2>

                    <p className="mt-3 text-sm leading-6 text-amber-800">
                      Usa un número real y sin espacios para que las acciones
                      rápidas funcionen correctamente.
                    </p>
                  </div>

                  <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
                    <h2 className="text-xl font-black text-emerald-900">
                      Nada se pierde
                    </h2>

                    <p className="mt-3 text-sm leading-6 text-emerald-800">
                      ClienteYA conserva la información central de la relación
                      para que puedas recuperarla y enriquecerla más adelante.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}