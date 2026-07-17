import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RoleSelect } from "./role-select";

export const metadata = { title: "Members — GymFlow" };

export default async function MembersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!profile || profile.role !== "admin") redirect("/dashboard");

  // Show ALL users (not just members) so admin can manage roles
  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">All Users</h1>
      </div>

      <Card>
        <CardContent>
          {allProfiles && allProfiles.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-3 font-medium text-muted">Name</th>
                    <th className="pb-3 font-medium text-muted hidden sm:table-cell">Phone</th>
                    <th className="pb-3 font-medium text-muted">Role</th>
                    <th className="pb-3 font-medium text-muted hidden md:table-cell">Joined</th>
                    <th className="pb-3 font-medium text-muted">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {allProfiles.map((member) => (
                    <tr key={member.id}>
                      <td className="py-3">
                        <p className="font-medium">{member.full_name}</p>
                      </td>
                      <td className="py-3 hidden sm:table-cell text-muted">
                        {member.phone || "—"}
                      </td>
                      <td className="py-3">
                        <RoleSelect memberId={member.id} currentRole={member.role} />
                      </td>
                      <td className="py-3 hidden md:table-cell text-muted">
                        {new Date(member.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        <Link href={`/dashboard/members/${member.id}`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted text-center py-8">No users registered yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
