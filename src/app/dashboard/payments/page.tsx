import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata = { title: "Payments — GymFlow" };

export default async function PaymentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!profile || profile.role !== "admin") redirect("/dashboard");

  const { data: payments } = await supabase
    .from("payments")
    .select("*, profiles!payments_member_id_fkey(full_name)")
    .order("created_at", { ascending: false })
    .limit(50);

  // Revenue summary
  const { data: paidPayments } = await supabase
    .from("payments")
    .select("amount")
    .eq("status", "paid");

  const totalRevenue = paidPayments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Payments</h1>
        <Link href="/dashboard/payments/new">
          <Button size="sm"><Plus className="h-4 w-4" /> Record Payment</Button>
        </Link>
      </div>

      {/* Revenue Summary */}
      <Card>
        <CardContent className="flex items-center gap-4">
          <div>
            <p className="text-sm text-muted">Total Revenue (Paid)</p>
            <p className="text-3xl font-bold">₱{totalRevenue.toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>

      {/* Payment Records */}
      <Card>
        <CardHeader><CardTitle>Payment History</CardTitle></CardHeader>
        <CardContent>
          {payments && payments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-3 font-medium text-muted">Member</th>
                    <th className="pb-3 font-medium text-muted">Amount</th>
                    <th className="pb-3 font-medium text-muted hidden sm:table-cell">Method</th>
                    <th className="pb-3 font-medium text-muted hidden md:table-cell">Date</th>
                    <th className="pb-3 font-medium text-muted">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="py-3 font-medium">
                        {(payment as any).profiles?.full_name || "Unknown"}
                      </td>
                      <td className="py-3">₱{Number(payment.amount).toLocaleString()}</td>
                      <td className="py-3 hidden sm:table-cell text-muted capitalize">{payment.method}</td>
                      <td className="py-3 hidden md:table-cell text-muted">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        <Badge variant={payment.status === "paid" ? "success" : payment.status === "overdue" ? "destructive" : "warning"}>
                          {payment.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted text-center py-8">No payment records.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
