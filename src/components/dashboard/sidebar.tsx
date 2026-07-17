"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Calendar,
  ClipboardCheck,
  Dumbbell,
  UserCircle,
  Zap,
} from "lucide-react";
import type { UserRole } from "@/lib/types/database";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "trainer", "member"] },
  { label: "Members", href: "/dashboard/members", icon: Users, roles: ["admin"] },
  { label: "Memberships", href: "/dashboard/memberships", icon: CreditCard, roles: ["admin"] },
  { label: "Sessions", href: "/dashboard/sessions", icon: Calendar, roles: ["admin", "trainer", "member"] },
  { label: "Attendance", href: "/dashboard/attendance", icon: ClipboardCheck, roles: ["admin", "trainer"] },
  { label: "Payments", href: "/dashboard/payments", icon: CreditCard, roles: ["admin"] },
  { label: "Trainers", href: "/dashboard/trainers", icon: Dumbbell, roles: ["admin"] },
  { label: "Profile", href: "/dashboard/profile", icon: UserCircle, roles: ["admin", "trainer", "member"] },
];

export function DashboardSidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const filteredItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 border-r border-border bg-background/90 backdrop-blur-md">
      <div className="p-6 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2 transition-all duration-200 ease-in-out hover:opacity-80">
          <Dumbbell className="h-6 w-6 text-accent" />
          <span className="text-xl font-bold text-foreground">GymFlow</span>
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {filteredItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ease-in-out ${
                isActive
                  ? "bg-accent/10 text-accent border-l-2 border-accent shadow-[inset_0_0_8px_rgba(56,189,248,0.1)]"
                  : "text-muted hover:bg-secondary hover:text-foreground hover:border-l-2 hover:border-accent/50 border-l-2 border-transparent"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="flex-1">{item.label}</span>
              <Zap className={`h-3 w-3 transition-opacity duration-200 ease-in-out ${
                isActive ? "text-accent opacity-100" : "text-accent/40 opacity-0 group-hover:opacity-100"
              }`} />
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
