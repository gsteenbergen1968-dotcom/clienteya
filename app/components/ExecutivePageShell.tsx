type ExecutivePageShellProps = {
  children: React.ReactNode;
  className?: string;
};

export default function ExecutivePageShell({
  children,
  className = "",
}: ExecutivePageShellProps) {
  return (
    <main className={`mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 ${className}`}>
      <div className="space-y-6">{children}</div>
    </main>
  );
}