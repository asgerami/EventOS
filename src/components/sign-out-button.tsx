"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { LogOut } from "lucide-react";

interface SignOutButtonProps {
  className?: string;
  children?: React.ReactNode;
  showIcon?: boolean;
}

export function SignOutButton({ className, children, showIcon = true }: SignOutButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    await authClient.signOut();
    window.location.href = "/";
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      className={className}
    >
      {showIcon && <LogOut className="h-4 w-4 shrink-0" />}
      {children ?? (loading ? "Signing out…" : "Sign out")}
    </button>
  );
}
