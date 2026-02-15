"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CopyTicketLinkButton({
  eventId,
  registrationId,
  className,
}: {
  eventId: string;
  registrationId: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const res = await fetch(
        `/api/events/${eventId}/registrations/${registrationId}/ticket-url`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get link");
      const url = typeof window !== "undefined" ? `${window.location.origin}${data.path}` : data.path;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={className}
      onClick={handleCopy}
    >
      {copied ? "Copied!" : "Copy ticket link"}
    </Button>
  );
}
