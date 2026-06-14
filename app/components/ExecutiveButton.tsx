import Link from "next/link";

type ExecutiveButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ExecutiveButtonProps = {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: ExecutiveButtonVariant;
  className?: string;
};

function getVariantClasses(variant: ExecutiveButtonVariant) {
  const variants: Record<ExecutiveButtonVariant, string> = {
    primary:
      "border-slate-950 bg-slate-950 text-white hover:bg-slate-800 hover:border-slate-800",
    secondary:
      "border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
    ghost:
      "border-transparent bg-transparent text-slate-600 hover:bg-slate-100",
    danger:
      "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
  };

  return variants[variant];
}

const baseClasses =
  "inline-flex items-center justify-center rounded-2xl border px-4 py-2 text-sm font-bold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-50";

export default function ExecutiveButton({
  children,
  href,
  onClick,
  type = "button",
  variant = "primary",
  className = "",
}: ExecutiveButtonProps) {
  const classes = `${baseClasses} ${getVariantClasses(variant)} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={classes}>
      {children}
    </button>
  );
}