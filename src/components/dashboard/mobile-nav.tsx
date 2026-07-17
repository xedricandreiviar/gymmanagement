"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, LayoutDashboard, Users, CreditCard, Calendar, ClipboardCheck, Dumbbell, UserCircle } from "lucide-react";
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

interface MobileNavProps {
  role: UserRole;
  open: boolean;
  onClose: () => void;
}

export function MobileNav({ role, open, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const filteredItems = navItems.filter((item) => item.roles.includes(role));

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="fixed inset-y-0 left-0 w-72 bg-background border-r border-border p-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">GymFlow</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-md hover:bg-secondary" aria-label="Close navigation">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="space-y-1">
          {filteredItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted hover:bg-secondary hover:text-foreground"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
