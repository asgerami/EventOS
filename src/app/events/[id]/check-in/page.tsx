"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Activity,
  ScanLine,
  Keyboard,
  CameraOff,
  CloudOff,
  RefreshCw,
  ShieldAlert,
  CheckCircle2,
  Wifi,
  QrCode,
} from "lucide-react";
import {
  addToOfflineQueue,
  getOfflineQueue,
  getOfflineQueueCount,
  removeFromOfflineQueue,
} from "@/lib/offline-checkin-queue";

type Station = { id: string; name: string; type: string; _count: { checkIns: number } };

const STATS_POLL_INTERVAL_MS = 5000;

export default function CheckInPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [stations, setStations] = useState<Station[]>([]);
  const [stationId, setStationId] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [stats, setStats] = useState<{ todayCount: number; totalCount: number } | null>(null);
  const [scanMode, setScanMode] = useState<"manual" | "camera">("manual");
  const [cameraSupported, setCameraSupported] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingQueueCount, setPendingQueueCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [scanFeedback, setScanFeedback] = useState<{
    type: "idle" | "scanning" | "success" | "error";
    text: string;
  }>({ type: "idle", text: "Ready to scan" });

  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const zxingControlsRef = useRef<{ stop: () => void } | null>(null);
  const submitTokenRef = useRef<(t: string, method?: "manual" | "qr_scan") => Promise<void>>(() => Promise.resolve());
  const scanInFlightRef = useRef(false);
  const lastScanRef = useRef<{ value: string; at: number }>({ value: "", at: 0 });
  const feedbackTimeoutRef = useRef<number | null>(null);

  const [scanAccessDenied, setScanAccessDenied] = useState(false);

  const fetchStats = useCallback(() => {
    fetch(`/api/events/${eventId}/check-in/stats`, { credentials: "include" })
      .then((res) => {
        if (res.status === 403) {
          setScanAccessDenied(true);
          return {};
        }
        return res.json();
      })
      .then((data: Record<string, unknown>) => {
        if (data.todayCount !== undefined)
          setStats({ todayCount: data.todayCount as number, totalCount: data.totalCount as number });
      })
      .catch(() => {});
  }, [eventId]);

  const setTransientFeedback = useCallback(
    (type: "scanning" | "success" | "error", text: string, durationMs = 1400) => {
      setScanFeedback({ type, text });
      if (feedbackTimeoutRef.current) {
        window.clearTimeout(feedbackTimeoutRef.current);
      }
      feedbackTimeoutRef.current = window.setTimeout(() => {
        setScanFeedback({ type: "idle", text: "Ready to scan" });
        feedbackTimeoutRef.current = null;
      }, durationMs);
    },
    []
  );

  // Load stations and initial stats
  useEffect(() => {
    fetch(`/api/events/${eventId}/stations`)
      .then((res) => res.json())
      .then((data) => {
        if (data.stations?.length) {
          setStations(data.stations);
          setStationId((prev) => prev || data.stations[0].id);
        }
      })
      .catch(() => setMessage({ type: "error", text: "Failed to load stations" }));
    fetchStats();
  }, [eventId, fetchStats]);

  // Real-time stats polling (pause when tab hidden)
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        fetchStats();
      }
    }, STATS_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchStats]);

  // Detect camera API availability.
  useEffect(() => {
    const hasCameraApi =
      typeof navigator !== "undefined" &&
      !!navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === "function";

    setCameraSupported(hasCameraApi);
  }, []);

  // Camera stream and scan loop
  useEffect(() => {
    if (scanMode !== "camera" || !cameraSupported || !videoRef.current || !stationId) return;

    let cancelled = false;
    const video = videoRef.current;

    const startCamera = async () => {
      setCameraError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        video.srcObject = stream;
        await video.play();
        setCameraActive(true);
        setScanFeedback({ type: "scanning", text: "Scanning for QR..." });

        const { BrowserQRCodeReader } = await import("@zxing/browser");
        const reader = new BrowserQRCodeReader();

        const controls = await reader.decodeFromVideoDevice(undefined, video, async (result) => {
          if (!result) return;

          const value = result.getText().trim();
          if (!value) return;

          const now = Date.now();
          if (
            value === lastScanRef.current.value &&
            now - lastScanRef.current.at < 1500
          ) {
            return;
          }
          if (scanInFlightRef.current) return;

          scanInFlightRef.current = true;
          lastScanRef.current = { value, at: now };
          setTransientFeedback("scanning", "QR detected. Processing...");

          try {
            await submitTokenRef.current(value, "qr_scan");
          } finally {
            scanInFlightRef.current = false;
          }
        });

        if (cancelled) {
          controls.stop();
          return;
        }

        zxingControlsRef.current = controls;
      } catch (e) {
        if (!cancelled) {
          const message =
            e instanceof Error && /permission|denied|notallowed/i.test(e.message)
              ? "Camera permission was denied. Allow camera access to scan QR codes."
              : "Live QR scanning is not available in this browser. Use manual entry or a hardware scanner.";
          setCameraError(message);
          setCameraActive(false);
        }
      }
    };

    const stopCamera = () => {
      if (zxingControlsRef.current) {
        try {
          zxingControlsRef.current.stop();
        } catch {}
        zxingControlsRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (video.srcObject) video.srcObject = null;
      setCameraActive(false);
    };

    startCamera();
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [scanMode, cameraSupported, stationId]);

  const handleCheckInWithToken = useCallback(
    async (t: string, method: "manual" | "qr_scan" = "manual") => {
      if (!stationId || !t.trim()) return;
      setLoading(true);
      setMessage(null);
      try {
        const res = await fetch(`/api/events/${eventId}/check-in`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            token: t.trim(),
            stationId,
            method,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setMessage({
            type: "success",
            text: `Checked in: ${data.attendee?.name ?? "Attendee"}`,
          });
          setTransientFeedback("success", `Checked in: ${data.attendee?.name ?? "Attendee"}`);
          if (typeof navigator !== "undefined" && "vibrate" in navigator) {
            navigator.vibrate(40);
          }
          setToken("");
          fetchStats();
          inputRef.current?.focus();
        } else if (res.status === 409 && data.alreadyCheckedIn) {
          setMessage({
            type: "error",
            text: `Already checked in: ${data.attendee ?? "Attendee"}`,
          });
          setTransientFeedback("error", `Already checked in: ${data.attendee ?? "Attendee"}`);
          setToken("");
        } else if (res.status === 403) {
          setMessage({
            type: "error",
            text: data.message ?? data.error ?? "You don’t have permission to scan. Ask your event organizer to add you as Staff in Team & scanners.",
          });
          setTransientFeedback("error", "Permission denied for scanning");
        } else {
          const errText = data.error ?? data.message ?? "Check-in failed";
          setMessage({ type: "error", text: errText });
          setTransientFeedback("error", errText);
        }
      } catch {
        setMessage({ type: "error", text: "Network error. Queued for sync when online." });
        setTransientFeedback("error", "Offline - scan queued");
        try {
          await addToOfflineQueue({
            eventId,
            stationId,
            token: t.trim(),
            method,
          });
          setToken("");
          setPendingQueueCount(await getOfflineQueueCount());
        } catch {
          setMessage({ type: "error", text: "Network error. Could not queue." });
          setTransientFeedback("error", "Could not queue scan");
        }
      } finally {
        setLoading(false);
      }
    },
    [eventId, stationId, fetchStats, setTransientFeedback]
  );

  useEffect(() => {
    submitTokenRef.current = handleCheckInWithToken;
  }, [handleCheckInWithToken]);

  const refreshPendingCount = useCallback(() => {
    getOfflineQueueCount().then(setPendingQueueCount);
  }, []);

  useEffect(() => {
    refreshPendingCount();
  }, [refreshPendingCount]);

  useEffect(() => {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        window.clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    setIsOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const flushOfflineQueue = useCallback(async () => {
    const items = await getOfflineQueue();
    if (items.length === 0) {
      setPendingQueueCount(0);
      return;
    }
    setSyncing(true);
    for (const item of items) {
      if (item.eventId !== eventId) continue;
      try {
        const res = await fetch(`/api/events/${eventId}/check-in`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            token: item.token,
            stationId: item.stationId,
            method: item.method,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          await removeFromOfflineQueue(item.id);
          fetchStats();
        } else if (res.status === 409 || res.status === 404 || res.status === 400) {
          await removeFromOfflineQueue(item.id);
        }
      } catch {
        break;
      }
    }
    setPendingQueueCount(await getOfflineQueueCount());
    setSyncing(false);
  }, [eventId, fetchStats]);

  useEffect(() => {
    if (isOnline && pendingQueueCount > 0) flushOfflineQueue();
  }, [isOnline, pendingQueueCount, flushOfflineQueue]);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = token.trim();
    if (!t) {
      setMessage({ type: "error", text: "Enter or scan a ticket code" });
      return;
    }
    if (!stationId) {
      setMessage({ type: "error", text: "Select a station first" });
      return;
    }
    await handleCheckInWithToken(t);
  };

  const stopCamera = () => {
    if (zxingControlsRef.current) {
      try {
        zxingControlsRef.current.stop();
      } catch {}
      zxingControlsRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current?.srcObject) videoRef.current.srcObject = null;
    setCameraActive(false);
    setScanMode("manual");
  };

  const canScan = !scanAccessDenied && stations.length > 0;
  const canUseCamera = cameraSupported === true && canScan;
  const feedbackTone: Record<typeof scanFeedback.type, string> = {
    idle: "bg-muted/70 text-muted-foreground",
    scanning: "bg-blue-500/20 text-blue-700 dark:text-blue-300",
    success: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300",
    error: "bg-destructive/20 text-destructive",
  };

  return (
    <div className="min-h-screen bg-background pb-safe">
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[padding:env(safe-area-inset-top)]:pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <Button asChild variant="ghost" size="icon" className="shrink-0">
            <Link href={`/events/${eventId}`}>←</Link>
          </Button>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold tracking-tight">Check-in Terminal</h1>
            <p className="truncate text-xs text-muted-foreground">Fast QR check-in</p>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <div className="inline-flex items-center gap-1 rounded-md border bg-muted/30 px-2 py-1 text-xs">
              {isOnline ? <Wifi className="h-3.5 w-3.5 text-emerald-500" /> : <CloudOff className="h-3.5 w-3.5 text-amber-500" />}
              <span className="font-medium">{isOnline ? "Online" : "Offline"}</span>
            </div>
            <div className="inline-flex items-center gap-1 rounded-md border bg-muted/30 px-2 py-1 text-xs">
              <Activity className="h-3.5 w-3.5 text-primary" />
              Queue: <span className="font-semibold tabular-nums">{pendingQueueCount}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-4 sm:px-6 lg:py-6">
        <section className="space-y-4">
          <Card className="border-border/70">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <QrCode className="h-4 w-4 text-primary" />
                Scanner
              </CardTitle>
              <CardDescription>Select station, then scan.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {scanAccessDenied && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm">
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    <div>
                      <p className="font-medium text-destructive">You do not have scanner access</p>
                      <p className="mt-1 text-muted-foreground">
                        Ask an organizer to add you as <strong>Staff (scanner)</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!isOnline && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
                  You are offline. New scans will be queued and synced automatically.
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="station">Station</Label>
                  {stations.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                      No stations found.{" "}
                      <Link href={`/events/${eventId}/stations/new`} className="font-medium text-primary underline">
                        Add station
                      </Link>
                    </div>
                  ) : (
                    <select
                      id="station"
                      className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm sm:text-base"
                      value={stationId}
                      onChange={(e) => setStationId(e.target.value)}
                      disabled={loading || scanAccessDenied}
                    >
                      {stations.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.type}) - {s._count.checkIns} scans
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="space-y-2 sm:col-span-2">
                  {cameraSupported === true ? (
                    <div className="inline-flex rounded-lg border p-1">
                      <button
                        type="button"
                        onClick={() => setScanMode("camera")}
                        className={`inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm ${
                          scanMode === "camera" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                        }`}
                        disabled={loading || !canScan}
                      >
                        <ScanLine className="h-4 w-4" />
                        Camera
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          stopCamera();
                          setScanMode("manual");
                        }}
                        className={`inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm ${
                          scanMode === "manual" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                        }`}
                        disabled={loading || scanAccessDenied}
                      >
                        <Keyboard className="h-4 w-4" />
                        Manual
                      </button>
                    </div>
                  ) : cameraSupported === false ? (
                    <div className="inline-flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                      <CameraOff className="h-4 w-4" />
                      Camera scanning unavailable on this browser
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-md border px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Today</p>
                  <p className="text-lg font-semibold tabular-nums">{stats?.todayCount ?? "-"}</p>
                </div>
                <div className="rounded-md border px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total</p>
                  <p className="text-lg font-semibold tabular-nums">{stats?.totalCount ?? "-"}</p>
                </div>
                <div className="rounded-md border px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Queue</p>
                  <p className="text-lg font-semibold tabular-nums">{pendingQueueCount}</p>
                </div>
              </div>

              {pendingQueueCount > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={syncing || !isOnline}
                  onClick={() => flushOfflineQueue()}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
                  {syncing ? "Syncing..." : "Sync queued scans"}
                </Button>
              )}

              {scanMode === "camera" && canUseCamera && (
                <div className="overflow-hidden rounded-lg border">
                  <div className="relative aspect-3/4 bg-black sm:aspect-4/3">
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className="h-full w-full object-cover"
                    />
                    {cameraError && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4 text-center text-sm text-white">
                        {cameraError}
                      </div>
                    )}
                    {cameraActive && !cameraError && (
                      <div className="pointer-events-none absolute inset-0">
                        <div className="absolute inset-0 bg-black/20" />
                        <div className="absolute top-1/2 left-1/2 w-[68%] max-w-[300px] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.25)]">
                          <div className="absolute inset-0 rounded-2xl border border-white/40" />
                          {/* QR-style corner guides */}
                          <div className="absolute top-0 left-0 h-10 w-10 border-t-4 border-l-4 border-violet-400 rounded-tl-lg" />
                          <div className="absolute top-0 right-0 h-10 w-10 border-t-4 border-r-4 border-violet-400 rounded-tr-lg" />
                          <div className="absolute bottom-0 left-0 h-10 w-10 border-b-4 border-l-4 border-violet-400 rounded-bl-lg" />
                          <div className="absolute right-0 bottom-0 h-10 w-10 border-r-4 border-b-4 border-violet-400 rounded-br-lg" />
                          {/* subtle inner guide grid */}
                          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                            <div className="border-r border-white/10 border-b" />
                            <div className="border-r border-white/10 border-b" />
                            <div className="border-b border-white/10" />
                            <div className="border-r border-white/10 border-b" />
                            <div className="border-r border-white/10 border-b" />
                            <div className="border-b border-white/10" />
                            <div className="border-r border-white/10" />
                            <div className="border-r border-white/10" />
                            <div />
                          </div>
                          {/* scan line */}
                          <div className="absolute inset-x-4 top-1/2 h-0.5 -translate-y-1/2 bg-linear-to-r from-transparent via-violet-300 to-transparent opacity-90 shadow-[0_0_10px_rgba(167,139,250,0.8)]" />
                        </div>
                        <p className="absolute right-0 bottom-5 left-0 text-center text-xs font-medium text-white/90">
                          Place QR code inside the frame
                        </p>
                      </div>
                    )}
                    <div
                      className={`absolute top-3 left-3 right-16 rounded-md px-2.5 py-1.5 text-xs font-medium ${feedbackTone[scanFeedback.type]}`}
                    >
                      {scanFeedback.text}
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="absolute right-3 bottom-3"
                      onClick={stopCamera}
                    >
                      Stop
                    </Button>
                  </div>
                </div>
              )}

              {(scanMode === "manual" || !canUseCamera) && (
                <form onSubmit={handleCheckIn} className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="token">Ticket code</Label>
                    <Input
                      id="token"
                      ref={inputRef}
                      type="text"
                      placeholder="Scan or paste ticket code"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      disabled={loading || scanAccessDenied}
                      autoFocus
                      autoComplete="off"
                      className="h-12 text-base"
                    />
                  </div>

                  {message && (
                    <div
                      className={`rounded-lg border px-3 py-2.5 text-sm ${
                        message.type === "success"
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          : "border-destructive/30 bg-destructive/10 text-destructive"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {message.type === "success" ? (
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                        ) : (
                          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                        )}
                        <span>{message.text}</span>
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="h-12 w-full text-base"
                    disabled={loading || !canScan}
                  >
                    {loading ? "Processing..." : "Check In"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
