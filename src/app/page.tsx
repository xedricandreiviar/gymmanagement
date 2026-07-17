import Link from "next/link";
import { Dumbbell, Users, Calendar, CreditCard, Shield, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Users,
    title: "Member Management",
    description: "Register members, manage memberships, and track engagement all in one place.",
  },
  {
    icon: Calendar,
    title: "Session Scheduling",
    description: "Create classes, set recurring schedules, and let members book spots effortlessly.",
  },
  {
    icon: CreditCard,
    title: "Payment Tracking",
    description: "Record payments, track revenue, and monitor billing status across all members.",
  },
  {
    icon: Shield,
    title: "Role-Based Access",
    description: "Secure admin, trainer, and member portals with granular permissions.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Dashboard",
    description: "Live stats on attendance, revenue, and capacity to keep your gym running smoothly.",
  },
  {
    icon: Dumbbell,
    title: "Trainer Profiles",
    description: "Manage trainer schedules, specializations, and class assignments.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Dumbbell className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">GymFlow</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
              Manage your gym,{" "}
              <span className="text-primary">effortlessly</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted max-w-2xl mx-auto">
              GymFlow handles member registration, scheduling, attendance, and payments so you can focus on what matters — helping people get fit.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg">Start Free Trial</Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg">Sign In</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-border">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground">Everything you need</h2>
            <p className="mt-4 text-muted text-lg">A complete toolkit for modern gym management</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="p-6 rounded-lg border border-border hover:border-primary/50 transition-colors">
                <feature.icon className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-muted">
          <p>&copy; {new Date().getFullYear()} GymFlow. Built with Next.js and Supabase.</p>
        </div>
      </footer>
    </div>
  );
}
