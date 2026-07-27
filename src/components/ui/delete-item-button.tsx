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

interface DeleteItemButtonProps {
    /** Full API path, e.g. /api/events/abc/sessions/xyz */
    apiPath: string;
    /** Human-readable label shown in the dialog, e.g. "session" */
    itemType: string;
    /** Name of the item to show in the dialog */
    itemName: string;
    /** URL to redirect/refresh after deletion. Uses router.refresh() if not provided. */
    onDeletedRedirectTo?: string;
    /** Compact icon-only variant */
    iconOnly?: boolean;
}

export function DeleteItemButton({
    apiPath,
    itemType,
    itemName,
    onDeletedRedirectTo,
    iconOnly = false,
}: DeleteItemButtonProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleDelete() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(apiPath, { method: "DELETE" });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error ?? `Failed to delete ${itemType}`);
            }
            setOpen(false);
            if (onDeletedRedirectTo) {
                router.push(onDeletedRedirectTo);
            }
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!loading) setOpen(v); }}>
            <DialogTrigger asChild>
                {iconOnly ? (
                    <button
                        className="flex h-9 w-9 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-destructive/10 hover:text-destructive"
                        title={`Delete ${itemType}`}
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                ) : (
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-destructive/30 text-destructive hover:border-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                        Delete
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span className="eyebrow text-destructive">
                            Permanent
                        </span>
                    </div>
                    <DialogTitle className="capitalize">
                        Delete {itemType}?
                    </DialogTitle>
                    <DialogDescription>
                        <span className="font-semibold text-ink">&ldquo;{itemName}&rdquo;</span> will be
                        permanently deleted. This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <div className="rounded-md border border-destructive/25 bg-destructive/10 px-4 py-3 text-small text-destructive">
                        {error}
                    </div>
                )}

                <DialogFooter className="mt-2 flex-col gap-2 sm:flex-row sm:justify-end">
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
                                Yes, delete
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
