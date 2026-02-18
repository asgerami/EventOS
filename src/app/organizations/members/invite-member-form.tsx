"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type InviteMemberInput = Parameters<typeof authClient.organization.inviteMember>[0];
type MemberInviteRole = "staff" | "cohost" | "owner";

const ROLES = [
  { value: "staff", label: "Staff (scanner only)" },
  { value: "cohost", label: "Cohost (manage events + scan)" },
  { value: "owner", label: "Owner (full access)" },
] as const;

export function InviteMemberForm({ organizationId }: { organizationId: string }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MemberInviteRole>("staff");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setInviteLink(null);
    if (!email.trim()) return;

    setLoading(true);
    try {
      const result = await authClient.organization.inviteMember({
        email: email.trim().toLowerCase(),
        // better-auth client typings only include default roles, while server config uses custom roles.
        role: role as unknown as InviteMemberInput["role"],
        organizationId,
      });

      if (result.error) {
        setMessage({ type: "error", text: result.error.message ?? "Failed to invite" });
        setLoading(false);
        return;
      }

      const data = result.data as { id?: string } | undefined;
      if (data?.id) {
        const base = typeof window !== "undefined" ? window.location.origin : "";
        setInviteLink(`${base}/accept-invitation?invitationId=${data.id}`);
      }
      setMessage({
        type: "success",
        text: data?.id
          ? "Invitation created. Share the link below with them (they must be signed in or sign up first)."
          : "Invitation sent. If you have invitation emails configured, they will receive an email.",
      });
      setEmail("");
      setLoading(false);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to invite" });
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {message && (
        <div
          className={`rounded-lg border px-3 py-2 text-sm ${
            message.type === "error"
              ? "border-destructive/20 bg-destructive/5 text-destructive"
              : "border-primary/20 bg-primary/5 text-foreground"
          }`}
        >
          {message.text}
        </div>
      )}
      {inviteLink && (
        <div className="rounded-lg border bg-muted/50 p-3">
          <p className="mb-1 text-xs font-medium text-muted-foreground">Invitation link (copy and send to them)</p>
          <code className="block break-all text-xs">{inviteLink}</code>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="invite-email">Email</Label>
          <Input
            id="invite-email"
            type="email"
            placeholder="scanner@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
            className="rounded-lg"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="invite-role">Role</Label>
          <select
            id="invite-role"
            value={role}
            onChange={(e) => setRole(e.target.value as MemberInviteRole)}
            disabled={loading}
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <Button type="submit" disabled={loading} className="btn-gradient rounded-lg">
        {loading ? "Sending…" : "Create invitation"}
      </Button>
    </form>
  );
}
