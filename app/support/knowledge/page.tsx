import Link from "next/link";

import { buildSupportMemoryAdapter } from "../adapters";
import { buildSupportRepository } from "../repositories";

type KnowledgeCard = {
  id: string;
  title: string;
  category: string;
  status: "Active" | "Review" | "Draft";
  usageCount: number;
};

function getStatusLabel(status: string): KnowledgeCard["status"] {
  if (status === "review" || status === "in_review") {
    return "Review";
  }

  if (status === "draft") {
    return "Draft";
  }

  return "Active";
}

function getStatusClasses(status: KnowledgeCard["status"]) {
  if (status === "Review") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  if (status === "Draft") {
    return "border-slate-200 bg-slate-50 text-slate-700";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-800";
}

export default async function SupportKnowledgePage() {
  const adapter = buildSupportMemoryAdapter();
  const repository = buildSupportRepository(adapter);

  const [items, categories] = await Promise.all([
    repository.getKnowledgeItems(),
    repository.getKnowledgeCategories(),
  ]);

  const categoryNames = new Map(
    categories.map((category) => [category.id, category.name]),
  );

  const knowledgeItems: KnowledgeCard[] = items.map((item) => ({
    id: item.id,
    title: item.title,
    category:
      categoryNames.get(item.categoryId) ?? "Uncategorized",
    status: getStatusLabel(String(item.status)),
    usageCount: item.usageCount,
  }));

  return (
    <main className="space-y-6">
      <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_14px_44px_rgba(15,23,42,0.05)]">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
          SIP Knowledge
        </p>

        <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">
          Knowledge
        </h1>

        <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
          Manage the knowledge base that powers automatic responses and SIP
          continuous learning.
        </p>

        <Link
          href="/support"
          className="mt-5 inline-flex items-center justify-center rounded-2xl border border-blue-200 bg-white px-5 py-3 text-sm font-black text-blue-700 transition hover:bg-blue-50"
        >
          Back to Cockpit
        </Link>
      </section>

      <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_14px_44px_rgba(15,23,42,0.05)]">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
            Knowledge Base
          </p>

          <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
            Articles and Answers
          </h2>
        </div>

        {knowledgeItems.length === 0 ? (
          <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <h3 className="text-lg font-black text-slate-950">
              No knowledge available
            </h3>

            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              Articles created by the team and SIP learning outcomes will
              appear here.
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {knowledgeItems.map((item) => (
              <article
                key={item.id}
                className="rounded-3xl border border-slate-200 bg-white p-5"
              >
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${getStatusClasses(
                    item.status,
                  )}`}
                >
                  {item.status}
                </span>

                <h3 className="mt-4 text-xl font-black text-slate-950">
                  {item.title}
                </h3>

                <p className="mt-2 text-sm font-semibold text-slate-600">
                  {item.category}
                </p>

                <p className="mt-4 text-sm font-black text-blue-700">
                  Usage: {item.usageCount}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}