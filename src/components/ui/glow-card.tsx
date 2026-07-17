interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
}

export function GlowCard({ children, className = "" }: GlowCardProps) {
  return (
    <div
      className={`rounded-lg border border-border bg-gradient-to-br from-[#0a1628] to-[#2563eb] p-6 shadow-sm transition-all duration-200 ease-in-out hover:shadow-[0_0_8px_rgba(56,189,248,0.4)] focus-within:shadow-[0_0_8px_rgba(56,189,248,0.4)] ${className}`}
    >
      {children}
    </div>
  );
}
