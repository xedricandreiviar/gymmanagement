import Link from "next/link";
import { GlowCard } from "@/components/ui/glow-card";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactElement;
  href?: string;
  className?: string;
}

export function MetricCard({ title, value, icon, href, className = "" }: MetricCardProps) {
  const content = (
    <GlowCard className={`${href ? "cursor-pointer" : ""} ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted">{title}</p>
          <p className="mt-1 text-2xl font-bold text-card-foreground">{value}</p>
        </div>
        <div className="text-accent">{icon}</div>
      </div>
    </GlowCard>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
