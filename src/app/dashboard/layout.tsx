import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <DashboardSidebar role={profile.role} />
      <div className="flex-1 flex flex-col min-h-screen">
        <DashboardHeader profile={profile} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 bg-secondary/30">
          {children}
        </main>
      </div>
    </div>
  );
}
