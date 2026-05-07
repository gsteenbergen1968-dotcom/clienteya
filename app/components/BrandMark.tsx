import Link from "next/link";

type Props = {
  showTagline?: boolean;
};

export function BrandMark({ showTagline = false }: Props) {
  return (
    <Link href="/" className="brand-mark">
      <div className="brand-icon">
        <div className="brand-icon-red" />
        <div className="brand-icon-white" />
        <div className="brand-icon-blue" />
        <div className="brand-icon-text">PY</div>
      </div>

      <div>
        <div className="brand-text">
          Cliente<span className="brand-text-accent">YA</span>
        </div>

        {showTagline && (
          <div className="brand-tagline">Hecho para Paraguay</div>
        )}
      </div>
    </Link>
  );
}