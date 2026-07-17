"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Invitation, InvitationStatus } from "@/lib/types/database";

interface PaginatedResponse {
  data: Invitation[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

type RegistrationProgress = "Invited" | "Email Sent" | "Registration Complete" | "Active Member";

function getStatusBadgeVariant(status: InvitationStatus): "default" | "success" | "warning" | "destructive" | "secondary" {
  switch (status) {
    case "sent":
      return "default";
    case "accepted":
      return "success";
    case "expired":
      return "destructive";
    default:
      return "secondary";
  }
}

function getRegistrationProgress(invitation: Invitation): RegistrationProgress {
  if (invitation.status === "accepted") {
    return "Active Member";
  }
  if (invitation.status === "expired") {
    return "Invited";
  }
  // Status is "sent" — check if it's recent (within a few seconds of creation = just invited)
  const createdAt = new Date(invitation.created_at);
  const now = new Date();
  const minutesSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60);
  if (minutesSinceCreation < 1) {
    return "Invited";
  }
  return "Email Sent";
}

function getProgressBadgeVariant(progress: RegistrationProgress): "default" | "success" | "warning" | "destructive" | "secondary" {
  switch (progress) {
    case "Invited":
      return "secondary";
    case "Email Sent":
      return "default";
    case "Registration Complete":
      return "warning";
    case "Active Member":
      return "success";
    default:
      return "secondary";
  }
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function isExpired(invitation: Invitation): boolean {
  return invitation.status === "expired" || new Date(invitation.expires_at) < new Date();
}

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchInvitations = useCallback(async (pageNum: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/invitations?page=${pageNum}&pageSize=50`);
      if (!response.ok) {
        throw new Error("Failed to fetch invitations");
      }
      const data: PaginatedResponse = await response.json();
      setInvitations(data.data);
      setTotalPages(data.totalPages);
      setTotal(data.total);
      setPage(data.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvitations(page);
  }, [fetchInvitations, page]);

  const handleResend = async (id: string) => {
    setResendingId(id);
    try {
      const response = await fetch(`/api/invitations/${id}/resend`, {
        method: "POST",
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to resend invitation");
      }
      // Refresh the list after resending
      await fetchInvitations(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend invitation");
    } finally {
      setResendingId(null);
    }
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Invitations</h1>
        <p className="text-sm text-muted">
          {total} total invitation{total !== 1 ? "s" : ""}
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Member Invitations</CardTitle>
          <CardDescription>
            Track invitation status and registration progress for all members.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-6 w-6 text-accent" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="ml-2 text-sm text-muted">Loading invitations...</span>
            </div>
          ) : invitations.length === 0 ? (
            <p className="text-sm text-muted text-center py-8">
              No invitations yet. Create a member account to send the first invitation.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="pb-3 font-medium text-muted">Email</th>
                      <th className="pb-3 font-medium text-muted">Full Name</th>
                      <th className="pb-3 font-medium text-muted">Status</th>
                      <th className="pb-3 font-medium text-muted hidden md:table-cell">Progress</th>
                      <th className="pb-3 font-medium text-muted hidden sm:table-cell">Created</th>
                      <th className="pb-3 font-medium text-muted hidden lg:table-cell">Expires</th>
                      <th className="pb-3 font-medium text-muted">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {invitations.map((invitation) => {
                      const expired = isExpired(invitation);
                      const progress = getRegistrationProgress(invitation);

                      return (
                        <tr key={invitation.id}>
                          <td className="py-3">
                            <p className="font-medium truncate max-w-[200px]">{invitation.email}</p>
                          </td>
                          <td className="py-3">
                            <p className="truncate max-w-[150px]">{invitation.full_name}</p>
                          </td>
                          <td className="py-3">
                            <Badge variant={getStatusBadgeVariant(expired && invitation.status !== "accepted" ? "expired" : invitation.status)}>
                              {expired && invitation.status !== "accepted" ? "expired" : invitation.status}
                            </Badge>
                          </td>
                          <td className="py-3 hidden md:table-cell">
                            <Badge variant={getProgressBadgeVariant(progress)}>
                              {progress}
                            </Badge>
                          </td>
                          <td className="py-3 hidden sm:table-cell text-muted">
                            {formatDate(invitation.created_at)}
                          </td>
                          <td className="py-3 hidden lg:table-cell text-muted">
                            {formatDate(invitation.expires_at)}
                          </td>
                          <td className="py-3">
                            {(expired && invitation.status !== "accepted") && (
                              <Button
                                variant="outline"
                                size="sm"
                                loading={resendingId === invitation.id}
                                onClick={() => handleResend(invitation.id)}
                              >
                                Resend
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
                  <p className="text-sm text-muted">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousPage}
                      disabled={page <= 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={page >= totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
