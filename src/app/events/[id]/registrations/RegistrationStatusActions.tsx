"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Status = "PENDING" | "CONFIRMED" | "WAITLISTED" | "CANCELLED" | "REJECTED";

export function RegistrationStatusActions({
  eventId,
  registrationId,
  currentStatus,
}: {
  eventId: string;
  registrationId: string;
  currentStatus: Status;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const updateStatus = async (status: Status) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/events/${eventId}/registrations/${registrationId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status }),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update");
      }
      router.refresh();
    } catch {
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  if (currentStatus === "CONFIRMED")
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={loading}
        onClick={() => updateStatus("CANCELLED")}
      >
        {loading ? "..." : "Cancel"}
      </Button>
    );
  if (currentStatus === "CANCELLED" || currentStatus === "REJECTED")
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={loading}
        onClick={() => updateStatus("CONFIRMED")}
      >
        {loading ? "..." : "Re-open"}
      </Button>
    );
  return (
    <div className="flex gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={loading}
        onClick={() => updateStatus("CONFIRMED")}
      >
        {loading ? "..." : "Confirm"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={loading}
        onClick={() => updateStatus("CANCELLED")}
      >
        {loading ? "..." : "Cancel"}
      </Button>
    </div>
  );
}
