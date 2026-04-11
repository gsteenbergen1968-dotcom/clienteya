"use client";

import { useRouter } from "next/navigation";
import { createAuthClient } from "../../lib/supabase/auth-client";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createAuthClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-2xl border border-slate-300 px-4 py-2 text-sm"
    >
      Salir
    </button>
  );
}