import { GlowCard } from "@/components/ui/glow-card";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactElement;
  className?: string;
}

export function MetricCard({ title, value, icon, className = "" }: MetricCardProps) {
  return (
    <GlowCard className={className}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted">{title}</p>
          <p className="mt-1 text-2xl font-bold text-card-foreground">{value}</p>
        </div>
        <div className="text-accent">{icon}</div>
      </div>
    </GlowCard>
  );
}
