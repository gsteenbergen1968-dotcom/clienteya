import Link from "next/link";

type UpgradeTriggerCardProps = {
  badge?: string;

  title: string;

  description: string;

  features?: string[];

  buttonLabel?: string;

  href?: string;
};

export default function UpgradeTriggerCard({
  badge = "ClienteYA Pro",
  title,
  description,
  features = [],
  buttonLabel = "Ver planes",
  href = "/dashboard/billing",
}: UpgradeTriggerCardProps) {
  return (
    <div className="overflow-hidden rounded-[32px] border border-violet-200 bg-white shadow-sm">
      <div className="bg-gradient-to-br from-violet-50 via-white to-sky-50 p-6">
        <div className="inline-flex rounded-full border border-violet-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-violet-700 shadow-sm">
          {badge}
        </div>

        <div className="mt-5 max-w-3xl">
          <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            {title}
          </h2>

          <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
            {description}
          </p>
        </div>

        {features.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {features.map((feature) => (
              <div
                key={feature}
                className="rounded-full border border-white bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm"
              >
                {feature}
              </div>
            ))}
          </div>
        )}

        <div className="mt-8">
          <Link
            href={href}
            className="inline-flex items-center rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            {buttonLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}