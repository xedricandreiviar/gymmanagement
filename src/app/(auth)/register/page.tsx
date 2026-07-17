import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Sign Up — GymFlow" };

export default function RegisterPage() {
  return (
    <Card>
      <div className="flex flex-col items-center justify-center py-6 space-y-4 text-center">
        <div className="w-16 h-16 rounded-full bg-warning/20 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-warning"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-foreground">Registration Requires Admin Approval</h1>
        <p className="text-sm text-secondary-foreground max-w-sm">
          Self-registration is not available. Only accounts verified by a gym administrator can register. 
          Please contact your gym admin to receive an invitation link.
        </p>
        <p className="text-xs text-muted">
          If you already received an invitation email, click the link in that email to complete your registration.
        </p>
        <Link href="/login">
          <Button variant="outline">Back to Login</Button>
        </Link>
      </div>
    </Card>
  );
}
