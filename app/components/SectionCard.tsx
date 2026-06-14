import { ui } from "../../lib/ui";

type SectionCardProps = {
  badge?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  tone?: "slate" | "emerald" | "amber" | "red" | "sky";
};

export default function SectionCard({
  badge,
  title,
  description,
  children,
  actions,
  tone = "slate",
}: SectionCardProps) {
  const toneClasses: Record<NonNullable<SectionCardProps["tone"]>, string> = {
    slate: "border-slate-200 bg-white",
    emerald: "border-emerald-200 bg-emerald-50/40",
    amber: "border-amber-200 bg-amber-50/40",
    red: "border-red-200 bg-red-50/40",
    sky: "border-sky-200 bg-sky-50/40",
  };

  return (
    <section
      className={`rounded-[28px] border p-4 shadow-sm sm:p-5 lg:p-6 ${toneClasses[tone]} ${ui.animations.card}`}
    >
      {(badge || title || description || actions) && (
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            {badge ? (
              <div className={`${ui.badges.neutral} mb-2 w-fit`}>
                {badge}
              </div>
            ) : null}

            <h2 className={ui.typography.sectionTitle}>{title}</h2>

            {description ? (
              <p className={`${ui.typography.body} mt-2 max-w-3xl leading-6`}>
                {description}
              </p>
            ) : null}
          </div>

          {actions ? (
            <div className="flex shrink-0 flex-wrap gap-2 lg:justify-end">
              {actions}
            </div>
          ) : null}
        </div>
      )}

      <div className="min-w-0">{children}</div>
    </section>
  );
}