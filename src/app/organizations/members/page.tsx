import { redirect } from "next/navigation";
import Link from "next/link";
import {
  requireAuth,
  getActiveOrganization,
  getActiveMemberRole,
} from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { AppNav } from "@/components/app-nav";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InviteMemberForm } from "./invite-member-form";
import { Building2, UserPlus, Users } from "lucide-react";

export default async function OrganizationMembersPage() {
  const session = await requireAuth();
  const organization = await getActiveOrganization();
  const memberRole = await getActiveMemberRole();

  if (!organization) redirect("/organizations");
  if (memberRole === "staff") redirect("/dashboard");

  const members = await prisma.member.findMany({
    where: { organizationId: organization.id },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const currentMember = members.find((m) => m.userId === session.user.id);
  const canInvite = currentMember && ["owner", "cohost"].includes(currentMember.role);

  const roleLabel: Record<string, string> = {
    owner: "Owner",
    cohost: "Cohost",
    staff: "Staff (scanner)",
  };

  return (
    <div className="flex min-h-screen flex-col">
      <AppNav />
      <div className="flex-1 p-4 sm:p-6">
        <div className="mx-auto max-w-2xl">
          <Button asChild variant="ghost" size="sm" className="mb-4 rounded-lg">
            <Link href="/dashboard">← Dashboard</Link>
          </Button>

          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Team & scanners</h1>
              <p className="text-sm text-muted-foreground">{organization.name}</p>
            </div>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Who can do what</CardTitle>
              <CardDescription>
                <strong>Owner / Cohost</strong> can manage events, stations, and invite people.{" "}
                <strong>Staff (scanner)</strong> can only open the check-in page and scan tickets at events. Scanners use the same login; you invite them here and they choose this workspace to access events.
              </CardDescription>
            </CardHeader>
          </Card>

          {canInvite && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Invite member
                </CardTitle>
                <CardDescription>
                  Add a scanner (staff) or a cohost. They’ll sign in with their email; send them the invite link after creating the invitation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <InviteMemberForm organizationId={organization.id} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Members ({members.length})</CardTitle>
              <CardDescription>Everyone in this workspace</CardDescription>
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No members yet.</p>
              ) : (
                <ul className="space-y-3">
                  {members.map((m) => (
                    <li
                      key={m.id}
                      className="flex items-center justify-between gap-4 rounded-lg border p-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium">{m.user.name}</p>
                          <p className="truncate text-sm text-muted-foreground">{m.user.email}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="shrink-0">
                        {roleLabel[m.role] ?? m.role}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
