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
      // Fetch user's organizations using better-auth organization client
      const { data } = await authClient.organization.list();
      setOrganizations(data || []);
      
      // Don't auto-select - let user manually choose to avoid redirect loops
    } catch (error) {
      console.error("Failed to load organizations:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectOrganization = async (orgId: string) => {
    if (selectingOrgId) return; // Prevent double-clicks
    
    setSelectingOrgId(orgId);
    try {
      console.log("[SelectOrg] Setting active organization:", orgId);
      
      const result = await authClient.organization.setActive({ 
        organizationId: orgId 
      });
      
      console.log("[SelectOrg] setActive result:", result);
      
      if (result.error) {
        throw new Error(result.error.message || "Failed to set active organization");
      }

      // Verify the session was actually updated
      console.log("[SelectOrg] Verifying session update...");
      const session = await authClient.getSession();
      console.log("[SelectOrg] Session after setActive:", session);
      
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Do a hard navigation to ensure cookies are read
      console.log("[SelectOrg] Navigating to dashboard...");
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("[SelectOrg] Failed to select organization:", error);
      alert(`Failed to select organization: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      
      if (data) {
        await selectOrganization(data.id);
      }
    } catch (error) {
      console.error("Failed to create organization:", error);
      alert("Failed to create organization. Slug might already be taken.");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading organizations...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppNav />
      <div className="flex flex-1 flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Workspace</h1>
          <p className="text-muted-foreground">
            Choose the workspace you want to work in
          </p>
        </div>

        {organizations.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {organizations.map((org) => {
              const isSelecting = selectingOrgId === org.id;
              return (
                <Card
                  key={org.id}
                  className={`cursor-pointer transition-all hover:border-primary ${
                    isSelecting ? "opacity-50 cursor-wait" : ""
                  }`}
                  onClick={() => !selectingOrgId && selectOrganization(org.id)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {org.name}
                      {isSelecting && (
                        <span className="text-sm font-normal text-muted-foreground">
                          Switching...
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription>@{org.slug}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        )}

        {!showCreateForm && (
          <Button
            onClick={() => setShowCreateForm(true)}
            variant="outline"
            className="w-full"
          >
            Create new organization
          </Button>
        )}

        {showCreateForm && (
          <Card>
            <CardHeader>
              <CardTitle>Create organization</CardTitle>
              <CardDescription>
                Your event company or organization
              </CardDescription>
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
                      // Auto-generate slug
                      setOrgSlug(
                        e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-")
                      );
                    }}
                    required
                    disabled={creating}
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
                  />
                  <p className="text-xs text-muted-foreground">
                    Used in URLs and API requests
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                  disabled={creating}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? "Creating..." : "Create organization"}
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
