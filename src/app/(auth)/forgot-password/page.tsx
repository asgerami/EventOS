"use client";

import { useState } from "react";
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
import { Loader2, MailCheck } from "lucide-react";
import { Logo } from "@/components/logo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (error) {
      setError(error.message ?? "Something went wrong. Please try again.");
    } else {
      setSent(true);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      {/* Background blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="animate-float-blob absolute -left-32 -top-32 h-96 w-96 rounded-full bg-violet-400/15 blur-3xl" />
        <div className="animate-float-blob-reverse absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-blue-400/10 blur-3xl" />
      </div>

      <div className="w-full max-w-sm page-enter">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Logo size={36} textClassName="text-xl font-semibold tracking-tight" className="justify-center" />
        </div>

        <Card className="glass-card shadow-xl shadow-violet-500/5">
          {sent ? (
            <>
              <CardHeader className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-violet-500/10">
                  <MailCheck className="h-6 w-6 text-violet-500" />
                </div>
                <CardTitle className="text-xl">Check your email</CardTitle>
                <CardDescription>
                  If <strong>{email}</strong> is registered, you'll receive a password reset link shortly.
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex flex-col gap-3">
                <p className="text-center text-sm text-muted-foreground">
                  Didn't receive it? Check your spam folder or{" "}
                  <button
                    className="font-medium text-primary hover:underline"
                    onClick={() => setSent(false)}
                  >
                    try again
                  </button>
                  .
                </p>
                <Link href="/sign-in" className="w-full">
                  <Button variant="outline" className="w-full rounded-lg">
                    Back to sign in
                  </Button>
                </Link>
              </CardFooter>
            </>
          ) : (
            <>
              <CardHeader className="text-center">
                <CardTitle className="text-xl">Forgot your password?</CardTitle>
                <CardDescription>
                  Enter your email address and we'll send you a link to reset it.
                </CardDescription>
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
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
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
                        Sending…
                      </>
                    ) : (
                      "Send reset link"
                    )}
                  </Button>
                  <p className="text-center text-sm text-muted-foreground">
                    Remembered it?{" "}
                    <Link href="/sign-in" className="font-medium text-primary hover:underline">
                      Sign in
                    </Link>
                  </p>
                </CardFooter>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
