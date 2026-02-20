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
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                        title={`Delete ${itemType}`}
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                ) : (
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:text-red-400 dark:hover:border-red-800 dark:hover:bg-red-950/30"
                    >
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                        Delete
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/50">
                        <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <DialogTitle className="text-center text-lg capitalize">
                        Delete {itemType}?
                    </DialogTitle>
                    <DialogDescription className="text-center text-sm">
                        <span className="font-medium text-foreground">&ldquo;{itemName}&rdquo;</span> will be
                        permanently deleted. This action cannot be undone.
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
                                Yes, delete
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
