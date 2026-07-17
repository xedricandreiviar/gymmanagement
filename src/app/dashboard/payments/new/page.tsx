import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PaymentForm } from "./payment-form";

export const metadata = { title: "Record Payment — GymFlow" };

export default async function NewPaymentPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!profile || profile.role !== "admin") redirect("/dashboard");

  const { data: members } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "member")
    .order("full_name", { ascending: true });

  return (
    <div className="max-w-2xl mx-auto">
      <PaymentForm members={members || []} />
    </div>
  );
}
