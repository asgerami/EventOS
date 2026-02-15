"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { AppNav } from "@/components/app-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, Building2, Loader2, Plus } from "lucide-react";

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectingOrgId, setSelectingOrgId] = useState<string | null>(null);
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const { data } = await authClient.organization.list();
      setOrganizations(data || []);
    } catch (error) {
      console.error("Failed to load organizations:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectOrganization = async (orgId: string) => {
    if (selectingOrgId) return;
    setSelectingOrgId(orgId);
    try {
      const result = await authClient.organization.setActive({ organizationId: orgId });
      if (result.error) throw new Error(result.error.message || "Failed to set active organization");
      await authClient.getSession();
      await new Promise((resolve) => setTimeout(resolve, 600));
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Failed to select organization:", error);
      alert(`Failed to select organization: ${error instanceof Error ? error.message : "Unknown error"}`);
      setSelectingOrgId(null);
    }
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return;
    setCreating(true);
    try {
      const { data } = await authClient.organization.create({
        name: orgName,
        slug: orgSlug || orgName.toLowerCase().replace(/\s+/g, "-"),
      });
      if (data) await selectOrganization(data.id);
    } catch (error) {
      console.error("Failed to create organization:", error);
      alert("Failed to create organization. Slug might already be taken.");
    } finally {
      setCreating(false);
    }
  };

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <AppNav />
        <div className="flex flex-1 items-center justify-center">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm">Loading workspaces…</span>
          </div>
        </div>
      </div>
    );
  }

  /* ── Page ── */
  return (
    <div className="flex min-h-screen flex-col">
      <AppNav />

      <div className="flex flex-1 flex-col items-center px-4 py-12 sm:py-16">
        <div className="w-full max-w-2xl space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Building2 className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Workspaces</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose a workspace to continue, or create a new one.
            </p>
          </div>

          {/* Org list */}
          {organizations.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {organizations.map((org) => {
                const isSelecting = selectingOrgId === org.id;
                return (
                  <Card
                    key={org.id}
                    className={`card-hover-glow group cursor-pointer overflow-hidden transition-all ${
                      isSelecting ? "opacity-60 pointer-events-none" : ""
                    }`}
                    onClick={() => !selectingOrgId && selectOrganization(org.id)}
                  >
                    <div className="h-1 bg-linear-to-r from-violet-500 to-indigo-500 opacity-0 transition-opacity group-hover:opacity-100" />
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between text-base">
                        <span className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                            <Building2 className="h-4 w-4 text-primary" />
                          </div>
                          {org.name}
                        </span>
                        {isSelecting ? (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        ) : (
                          <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                        )}
                      </CardTitle>
                      <CardDescription className="pl-10">@{org.slug}</CardDescription>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Create button */}
          {!showCreateForm && (
            <Button
              onClick={() => setShowCreateForm(true)}
              variant="outline"
              className="w-full rounded-xl"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Create new workspace
            </Button>
          )}

          {/* Create form */}
          {showCreateForm && (
            <Card className="overflow-hidden">
              <div className="h-1 bg-linear-to-r from-violet-500 to-indigo-500" />
              <CardHeader>
                <CardTitle>Create workspace</CardTitle>
                <CardDescription>Your event company or organization</CardDescription>
              </CardHeader>
              <form onSubmit={handleCreateOrg}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="org-name">Organization name</Label>
                    <Input
                      id="org-name"
                      placeholder="Acme Events"
                      value={orgName}
                      onChange={(e) => {
                        setOrgName(e.target.value);
                        setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                      }}
                      required
                      disabled={creating}
                      className="rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org-slug">Slug (URL identifier)</Label>
                    <Input
                      id="org-slug"
                      placeholder="acme-events"
                      value={orgSlug}
                      onChange={(e) => setOrgSlug(e.target.value)}
                      required
                      disabled={creating}
                      className="rounded-lg"
                    />
                    <p className="text-xs text-muted-foreground">Used in URLs and API requests</p>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                    disabled={creating}
                    className="rounded-lg"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={creating} className="btn-gradient rounded-lg">
                    {creating ? (
                      <>
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        Creating…
                      </>
                    ) : (
                      "Create workspace"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
