import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const metadata = { title: "Membership Plans — GymFlow" };

export default async function MembershipsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!profile || profile.role !== "admin") redirect("/dashboard");

  const { data: plans } = await supabase
    .from("membership_plans")
    .select("*")
    .order("price", { ascending: true });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Membership Plans</h1>
        <Link href="/dashboard/memberships/new">
          <Button size="sm"><Plus className="h-4 w-4" /> New Plan</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans && plans.length > 0 ? (
          plans.map((plan) => (
            <Card key={plan.id} className={!plan.is_active ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{plan.name}</CardTitle>
                  <Badge variant={plan.is_active ? "success" : "secondary"}>
                    {plan.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-3xl font-bold">₱{Number(plan.price).toLocaleString()}</p>
                <p className="text-sm text-muted">{plan.duration_days} days • {plan.type}</p>
                {plan.description && (
                  <p className="text-sm text-muted">{plan.description}</p>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-sm text-muted col-span-full text-center py-8">No plans created yet.</p>
        )}
      </div>
    </div>
  );
}
