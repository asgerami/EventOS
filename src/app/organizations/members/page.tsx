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
    staff: "Scanner",
  };

  return (
    <div className="flex min-h-screen flex-col">
      <AppNav />
      <div className="flex-1 p-4 sm:p-6">
        <div className="mx-auto max-w-3xl">
          <Button asChild variant="ghost" size="sm" className="mb-3 rounded-lg">
            <Link href="/dashboard">← Dashboard</Link>
          </Button>

          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight">Team</h1>
                <p className="text-sm text-muted-foreground">{organization.name}</p>
              </div>
            </div>
            <div className="rounded-md border bg-muted/40 px-3 py-1.5 text-sm">
              <span className="font-medium">{members.length}</span>{" "}
              <span className="text-muted-foreground">members</span>
            </div>
          </div>

          {canInvite && (
            <Card className="mb-6">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Invite
                </CardTitle>
              </CardHeader>
              <CardContent>
                <InviteMemberForm organizationId={organization.id} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Members</CardTitle>
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No members yet</p>
              ) : (
                <ul className="space-y-2">
                  {members.map((m) => (
                    <li
                      key={m.id}
                      className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{m.user.name}</p>
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
