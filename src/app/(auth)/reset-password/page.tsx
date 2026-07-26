"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
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
import { Loader2, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/logo";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!token) {
      setError("Missing reset token. Please use the link from your email.");
      return;
    }

    setLoading(true);

    const { error } = await authClient.resetPassword({
      newPassword: password,
      token,
    });

    setLoading(false);

    if (error) {
      setError(error.message ?? "Reset failed. The link may be expired — please request a new one.");
    } else {
      setDone(true);
    }
  };

  // No token in URL
  if (!token && !done) {
    return (
      <div className="w-full max-w-sm page-enter">
        <div className="mb-8 text-center">
          <Logo size={36} textClassName="text-xl font-semibold tracking-tight" className="justify-center" />
        </div>
        <Card className="glass-card shadow-xl shadow-violet-500/5">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Invalid link</CardTitle>
            <CardDescription>
              This password reset link is invalid or has expired. Please request a new one.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/forgot-password" className="w-full">
              <Button className="btn-gradient w-full rounded-lg">Request new link</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm page-enter">
      {/* Logo */}
      <div className="mb-8 text-center">
        <Logo size={36} textClassName="text-xl font-semibold tracking-tight" className="justify-center" />
      </div>

      <Card className="glass-card shadow-xl shadow-violet-500/5">
        {done ? (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-violet-500/10">
                <ShieldCheck className="h-6 w-6 text-violet-500" />
              </div>
              <CardTitle className="text-xl">Password updated!</CardTitle>
              <CardDescription>
                Your password has been changed successfully. You can now sign in with your new password.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button
                className="btn-gradient w-full rounded-lg"
                onClick={() => router.push("/sign-in")}
              >
                Go to sign in
              </Button>
            </CardFooter>
          </>
        ) : (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Set new password</CardTitle>
              <CardDescription>Choose a strong password for your account.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <div
                    className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive"
                    role="alert"
                  >
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="password">New password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    disabled={loading}
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm new password</Label>
                  <Input
                    id="confirm"
                    type="password"
                    placeholder="Repeat your password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    autoComplete="new-password"
                    disabled={loading}
                    className="rounded-lg"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button
                  type="submit"
                  className="btn-gradient w-full rounded-lg"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      Updating…
                    </>
                  ) : (
                    "Update password"
                  )}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Link expired?{" "}
                  <Link href="/forgot-password" className="font-medium text-primary hover:underline">
                    Request a new one
                  </Link>
                </p>
              </CardFooter>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      {/* Background blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="animate-float-blob absolute -left-32 -top-32 h-96 w-96 rounded-full bg-violet-400/15 blur-3xl" />
        <div className="animate-float-blob-reverse absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-blue-400/10 blur-3xl" />
      </div>

      <Suspense
        fallback={
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading…</span>
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
