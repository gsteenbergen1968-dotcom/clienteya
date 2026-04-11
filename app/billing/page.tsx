"use client";

import { useState } from "react";
import { createAuthClient } from "../../lib/supabase/auth-client";

export default function BillingPage() {
  const supabase = createAuthClient();

  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Debes iniciar sesión.");
        setLoading(false);
        return;
      }

      if (!file) {
        setError("Selecciona un comprobante.");
        setLoading(false);
        return;
      }

      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(filePath, file, {
          upsert: true,
        });

      if (uploadError) {
        setError(uploadError.message);
        setLoading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("payment-proofs")
        .getPublicUrl(filePath);

      const proofUrl = urlData.publicUrl;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          payment_proof_url: proofUrl,
          payment_notes: notes,
          subscription_status: "pending_review",
        })
        .eq("id", user.id);

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      setMessage(
        "Comprobante enviado correctamente. Revisaremos tu pago pronto."
      );
      setFile(null);
      setNotes("");
    } catch {
      setError("No se pudo subir el comprobante.");
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16 text-slate-900">
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Activar ClienteYA</h1>
          <p className="mt-2 text-slate-500">
            Activa tu cuenta con transferencia bancaria y sube tu comprobante.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-sm text-slate-500">Plan mensual</p>
            <p className="mt-2 text-4xl font-bold">50.000 Gs</p>
            <p className="mt-1 text-sm text-slate-500">por mes</p>

            <ul className="mt-6 space-y-2 text-sm text-slate-700">
              <li>✓ Clientes ilimitados</li>
              <li>✓ Dashboard completo</li>
              <li>✓ Recordatorios y calendario</li>
              <li>✓ Plantillas de WhatsApp</li>
              <li>✓ Panel admin y activación manual</li>
            </ul>

            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 text-sm">
              <p className="font-semibold">Datos para transferencia</p>

              <div className="mt-4 space-y-2 text-slate-700">
                <p>
                  <span className="font-medium">Banco:</span> Familiar
                </p>
                <p>
                  <span className="font-medium">Titular:</span> Gerard Henri Steenbergen
                </p>
                <p>
                  <span className="font-medium">Alias:</span> 9192349
                </p>
                <p>
                  <span className="font-medium">Número de cuenta:</span> 0-13905963
                </p>
                <p>
                  <span className="font-medium">Monto:</span> 50.000 Gs
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Después de transferir, sube el comprobante para activar tu cuenta.
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold">Subir comprobante</h2>
            <p className="mt-2 text-sm text-slate-500">
              Aceptamos imagen o PDF del comprobante de transferencia.
            </p>

            <form onSubmit={handleUpload} className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Archivo
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Nota opcional
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none"
                  placeholder="Ej. Transferencia hecha desde Banco Familiar"
                />
              </div>

              {message ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {message}
                </div>
              ) : null}

              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white"
              >
                {loading ? "Subiendo..." : "Enviar comprobante"}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          La activación se hace manualmente después de verificar el pago.
        </div>
      </div>
    </main>
  );
}