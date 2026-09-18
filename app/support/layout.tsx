import type { Metadata } from "next";
import type { ReactNode } from "react";

import { requireSipAccess } from "../../lib/sip-auth";

import SupportHeader from "./SupportHeader";
import SupportSidebar from "./SupportSidebar";

export const metadata: Metadata = {
  title: "SIP Cockpit | ClienteYA",
  description:
    "Support Intelligence Platform for operational support, learning and continuous improvement.",
};

type SupportLayoutProps = {
  children: ReactNode;
};

export default async function SupportLayout({
  children,
}: SupportLayoutProps) {
  await requireSipAccess();

  return (
    <>
      <div className="hidden min-h-screen bg-slate-50 lg:flex">
        <SupportSidebar />

        <div className="min-w-0 flex-1">
          <SupportHeader />

          <main className="px-8 py-8">
            <div className="mx-auto w-full max-w-[1440px]">
              {children}
            </div>
          </main>
        </div>
      </div>

      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 lg:hidden">
        <div className="max-w-md rounded-[30px] border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
            ClienteYA SIP
          </p>

          <h1 className="mt-3 text-2xl font-black text-slate-950">
            Desktop access only
          </h1>

          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
            The Support Intelligence Platform is designed for desktop operations.
          </p>
        </div>
      </div>
    </>
  );
}