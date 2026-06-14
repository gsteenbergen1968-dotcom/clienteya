type KpiCardProps = {
  label: string;
  value: string | number;
  tone?: "default" | "red" | "amber" | "emerald" | "sky";
};

function getToneClasses(tone: KpiCardProps["tone"]) {
  if (tone === "red") {
    return {
      card: "border-red-200 bg-red-50",
      label: "text-red-500",
      value: "text-red-700",
    };
  }

  if (tone === "amber") {
    return {
      card: "border-amber-200 bg-amber-50",
      label: "text-amber-500",
      value: "text-amber-700",
    };
  }

  if (tone === "emerald") {
    return {
      card: "border-emerald-200 bg-emerald-50",
      label: "text-emerald-500",
      value: "text-emerald-700",
    };
  }

  if (tone === "sky") {
    return {
      card: "border-sky-200 bg-sky-50",
      label: "text-sky-500",
      value: "text-sky-700",
    };
  }

  return {
    card: "border-slate-200 bg-white",
    label: "text-slate-400",
    value: "text-slate-900",
  };
}

export default function KpiCard({
  label,
  value,
  tone = "default",
}: KpiCardProps) {
  const styles = getToneClasses(tone);

  return (
    <div
      className={`min-w-0 rounded-[28px] border p-5 shadow-sm ${styles.card}`}
    >
      <p
        className={`text-[10px] font-black uppercase tracking-[0.18em] ${styles.label}`}
      >
        {label}
      </p>

      <p
        className={`mt-3 break-words text-3xl font-black leading-tight tracking-tight ${styles.value}`}
      >
        {value}
      </p>
    </div>
  );
}