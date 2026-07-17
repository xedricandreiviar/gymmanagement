import { Dumbbell } from "lucide-react";
import Link from "next/link";
import { LightningBolt } from "@/components/ui/lightning-bolt";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-background relative overflow-hidden">
      {/* Decorative lightning bolt elements */}
      <LightningBolt
        size="large"
        className="absolute top-10 left-10 text-accent"
      />
      <LightningBolt
        size="medium"
        className="absolute bottom-16 right-12 text-accent-yellow"
      />
      <LightningBolt
        size="small"
        className="absolute top-1/3 right-8 text-accent"
      />

      <Link href="/" className="flex items-center gap-2 mb-8 relative z-10">
        <Dumbbell className="h-8 w-8 text-primary" />
        <span className="text-2xl font-bold text-foreground">GymFlow</span>
      </Link>
      <div className="w-full max-w-md relative z-10">
        {children}
      </div>
    </div>
  );
}
