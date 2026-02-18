"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function AcceptInvitationPage() {
  const searchParams = useSearchParams();
  const invitationId = searchParams.get("invitationId");
  const [status, setStatus] = useState<"loading" | "success" | "error" | "wrong-account" | "need-login">("loading");
  const [message, setMessage] = useState("");

  const invitationCallbackUrl = `/accept-invitation?invitationId=${invitationId}`;

  const handleSignOut = async () => {
    await authClient.signOut();
    window.location.href = `/sign-in?callbackUrl=${encodeURIComponent(invitationCallbackUrl)}`;
  };

  useEffect(() => {
    if (!invitationId) {
      setStatus("error");
      setMessage("Missing invitation link.");
      return;
    }

    let cancelled = false;

    const run = async () => {
      const session = await authClient.getSession();
      const user = session?.data?.user ?? (session as { user?: { email?: string } })?.user;

      if (!user) {
        if (!cancelled) {
          setStatus("need-login");
          setMessage("Sign in or create an account with the email this invitation was sent to.");
        }
        return;
      }

      try {
        const result = await authClient.organization.acceptInvitation({ invitationId });

        if (cancelled) return;

        if (result.error) {
          const msg = result.error.message ?? "";
          if (msg.toLowerCase().includes("not the recipient")) {
            setStatus("wrong-account");
            setMessage(
              `You're signed in as ${(user as { email?: string }).email ?? "unknown"}, but this invitation was sent to a different email address. Sign out and sign in with the correct email.`
            );
          } else {
            setStatus("error");
            setMessage(msg || "Could not accept invitation.");
          }
          return;
        }

        setStatus("success");
        setMessage("You've joined the workspace. You can now switch to it from the dashboard.");
      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          setMessage(err instanceof Error ? err.message : "Something went wrong.");
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [invitationId]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Invitation</CardTitle>
          <CardDescription>
            {status === "loading" && "Accepting invitation…"}
            {status === "need-login" && "Sign in to join"}
            {status === "success" && "You're in"}
            {status === "wrong-account" && "Wrong account"}
            {status === "error" && "Unable to accept"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "loading" && (
            <div className="flex justify-center py-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {status === "wrong-account" && (
            <>
              <p className="text-sm text-muted-foreground">{message}</p>
              <div className="flex gap-2">
                <Button onClick={handleSignOut} className="btn-gradient rounded-lg">
                  Sign out &amp; switch account
                </Button>
                <Button asChild variant="outline" className="rounded-lg">
                  <Link href="/dashboard">Go to dashboard</Link>
                </Button>
              </div>
            </>
          )}

          {status === "need-login" && (
            <>
              <p className="text-sm text-muted-foreground">{message}</p>
              <div className="flex gap-2">
                <Button asChild className="btn-gradient rounded-lg">
                  <Link href={`/sign-in?callbackUrl=${encodeURIComponent(invitationCallbackUrl)}`}>
                    Sign in
                  </Link>
                </Button>
                <Button asChild variant="outline" className="rounded-lg">
                  <Link href={`/sign-up?callbackUrl=${encodeURIComponent(invitationCallbackUrl)}`}>
                    Create account
                  </Link>
                </Button>
              </div>
            </>
          )}

          {status === "success" && (
            <>
              <p className="text-sm text-muted-foreground">{message}</p>
              <Button asChild className="btn-gradient rounded-lg">
                <Link href="/dashboard">Go to dashboard</Link>
              </Button>
            </>
          )}

          {status === "error" && (
            <>
              <p className="text-sm text-muted-foreground">{message}</p>
              <Button asChild variant="outline" className="rounded-lg">
                <Link href="/dashboard">Go to dashboard</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
