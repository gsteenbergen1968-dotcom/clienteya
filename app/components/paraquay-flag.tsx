export default function ParaguayFlag({
  className = "h-6 w-6",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 600 400"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Bandera de Paraguay"
      role="img"
    >
      <rect width="600" height="133.33" y="0" fill="#d52b1e" />
      <rect width="600" height="133.33" y="133.33" fill="#ffffff" />
      <rect width="600" height="133.34" y="266.66" fill="#0038a8" />
      <circle
        cx="300"
        cy="200"
        r="48"
        fill="none"
        stroke="#111111"
        strokeWidth="6"
      />
      <circle
        cx="300"
        cy="200"
        r="38"
        fill="none"
        stroke="#111111"
        strokeWidth="2"
      />
      <polygon
        points="300,176 306,194 325,194 309,205 315,223 300,212 285,223 291,205 275,194 294,194"
        fill="#f2c300"
      />
      <path
        d="M262 221 A44 44 0 0 1 262 179"
        fill="none"
        stroke="#138a36"
        strokeWidth="4"
      />
      <path
        d="M338 179 A44 44 0 0 1 338 221"
        fill="none"
        stroke="#138a36"
        strokeWidth="4"
      />
    </svg>
  );
}