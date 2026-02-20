"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface DeleteEventButtonProps {
    eventId: string;
    eventName: string;
    registrationCount: number;
}

export function DeleteEventButton({
    eventId,
    eventName,
    registrationCount,
}: DeleteEventButtonProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleDelete() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/events/${eventId}`, { method: "DELETE" });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error ?? "Failed to delete event");
            }
            setOpen(false);
            router.push("/events");
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!loading) setOpen(v); }}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-11 rounded-xl border-red-200 bg-background/80 text-red-600 backdrop-blur hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:text-red-400 dark:hover:border-red-800 dark:hover:bg-red-950/30 sm:h-9 sm:rounded-lg"
                >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Delete
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/50">
                        <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <DialogTitle className="text-center text-lg">Delete event?</DialogTitle>
                    <DialogDescription className="text-center text-sm">
                        <span className="font-medium text-foreground">&ldquo;{eventName}&rdquo;</span> will be
                        permanently deleted and removed from your dashboard.
                        {registrationCount > 0 && (
                            <>
                                {" "}
                                <span className="font-medium text-red-600 dark:text-red-400">
                                    {registrationCount} registration{registrationCount !== 1 ? "s" : ""} will also be
                                    affected.
                                </span>
                            </>
                        )}
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
                        {error}
                    </div>
                )}

                <DialogFooter className="mt-2 flex-col gap-2 sm:flex-row sm:justify-center">
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={loading}
                        className="w-full sm:w-auto"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={loading}
                        className="w-full sm:w-auto"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deleting…
                            </>
                        ) : (
                            <>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Yes, delete event
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
