"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LightningBolt } from "@/components/ui/lightning-bolt";
import type { Database } from "@/lib/types/database";
import { useState } from "react";
import { MobileNav } from "./mobile-nav";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export function DashboardHeader({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <header className="h-16 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-4 md:px-6 lg:px-8 relative overflow-hidden">
        {/* Decorative lightning bolt */}
        <LightningBolt
          size="small"
          className="absolute right-24 top-1/2 -translate-y-1/2 text-accent"
        />

        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="lg:hidden p-2 rounded-md hover:bg-secondary transition-colors duration-200 ease-in-out"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium hidden sm:inline text-foreground">{profile.full_name}</span>
            <Badge variant={profile.role === "admin" ? "default" : profile.role === "trainer" ? "success" : "secondary"}>
              {profile.role}
            </Badge>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleSignOut} className="relative z-10 transition-colors duration-200 ease-in-out">
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sign out</span>
        </Button>
      </header>
      <MobileNav
        role={profile.role}
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />
    </>
  );
}
