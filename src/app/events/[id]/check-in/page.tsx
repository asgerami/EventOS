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
import { ScanLine, Keyboard, CameraOff, CloudOff, RefreshCw } from "lucide-react";
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

  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanLoopRef = useRef<number | null>(null);
  const submitTokenRef = useRef<(t: string, method?: "manual" | "qr_scan") => Promise<void>>(() => Promise.resolve());

  const fetchStats = useCallback(() => {
    fetch(`/api/events/${eventId}/check-in/stats`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.todayCount !== undefined)
          setStats({ todayCount: data.todayCount, totalCount: data.totalCount });
      })
      .catch(() => {});
  }, [eventId]);

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

  // BarcodeDetector support (Chrome, Edge, Android; not Safari)
  useEffect(() => {
    setCameraSupported(
      typeof window !== "undefined" &&
        "BarcodeDetector" in window &&
        typeof (window as unknown as { BarcodeDetector?: unknown }).BarcodeDetector === "function"
    );
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

        const BarcodeDetector = (window as unknown as { BarcodeDetector: new () => BarcodeDetector })
          .BarcodeDetector;
        const detector = new BarcodeDetector({ formats: ["qr_code"] });

        const detect = async () => {
          if (cancelled || !video.srcObject || video.readyState < 2) {
            scanLoopRef.current = requestAnimationFrame(detect);
            return;
          }
          try {
            const codes = await detector.detect(video);
            if (codes.length > 0 && codes[0].rawValue) {
              const value = codes[0].rawValue.trim();
              if (value) {
                setToken(value);
                setScanMode("manual");
                stopCamera();
                submitTokenRef.current(value, "qr_scan");
                return;
              }
            }
          } catch {
            // ignore single-frame errors
          }
          scanLoopRef.current = requestAnimationFrame(detect);
        };
        scanLoopRef.current = requestAnimationFrame(detect);
      } catch (e) {
        if (!cancelled) {
          setCameraError(
            e instanceof Error ? e.message : "Could not access camera. Use manual entry."
          );
          setCameraActive(false);
        }
      }
    };

    const stopCamera = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (video.srcObject) video.srcObject = null;
      if (scanLoopRef.current) cancelAnimationFrame(scanLoopRef.current);
      scanLoopRef.current = null;
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
          setToken("");
          fetchStats();
          inputRef.current?.focus();
        } else if (res.status === 409 && data.alreadyCheckedIn) {
          setMessage({
            type: "error",
            text: `Already checked in: ${data.attendee ?? "Attendee"}`,
          });
          setToken("");
        } else {
          setMessage({ type: "error", text: data.error ?? "Check-in failed" });
        }
      } catch {
        setMessage({ type: "error", text: "Network error. Queued for sync when online." });
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
        }
      } finally {
        setLoading(false);
      }
    },
    [eventId, stationId, fetchStats]
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
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current?.srcObject) videoRef.current.srcObject = null;
    if (scanLoopRef.current) cancelAnimationFrame(scanLoopRef.current);
    scanLoopRef.current = null;
    setCameraActive(false);
    setScanMode("manual");
  };

  return (
    <div className="min-h-screen bg-background pb-safe">
      {/* Sticky header - mobile friendly */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[padding:env(safe-area-inset-top)]:pt-[env(safe-area-inset-top)]">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button asChild variant="ghost" size="icon" className="shrink-0 -ml-1">
            <Link href={`/events/${eventId}`}>←</Link>
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold">Check-in</h1>
            <p className="truncate text-xs text-muted-foreground">Scan or enter ticket code</p>
          </div>
        </div>
        {/* Real-time stats bar */}
        {stats !== null && (
          <div className="grid grid-cols-2 gap-2 border-t px-4 py-3">
            <div className="rounded-lg bg-muted/60 px-3 py-2 text-center">
              <span className="block text-2xl font-bold tabular-nums">{stats.todayCount}</span>
              <span className="text-xs text-muted-foreground">Today</span>
            </div>
            <div className="rounded-lg bg-muted/60 px-3 py-2 text-center">
              <span className="block text-2xl font-bold tabular-nums">{stats.totalCount}</span>
              <span className="text-xs text-muted-foreground">Total</span>
            </div>
          </div>
        )}
        {/* Offline / queue banner */}
        {!isOnline && (
          <div className="flex items-center gap-2 border-t bg-amber-500/10 px-4 py-2 text-sm text-amber-800 dark:text-amber-200">
            <CloudOff className="h-4 w-4 shrink-0" />
            <span>You&apos;re offline. Check-ins will be queued and synced when back online.</span>
          </div>
        )}
        {isOnline && pendingQueueCount > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-muted/60 px-4 py-2 text-sm">
            <span className="text-muted-foreground">
              {pendingQueueCount} check-in{pendingQueueCount !== 1 ? "s" : ""} queued
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={syncing}
              onClick={() => flushOfflineQueue()}
            >
              <RefreshCw className={`h-4 w-4 shrink-0 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing…" : "Sync now"}
            </Button>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-lg px-4 py-4">
        {/* Station selector */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Station</CardTitle>
            <CardDescription>Select the check-in station</CardDescription>
          </CardHeader>
          <CardContent>
            {stations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No stations yet.{" "}
                <Link href={`/events/${eventId}/stations/new`} className="underline">
                  Add a station
                </Link>{" "}
                first.
              </p>
            ) : (
              <select
                className="flex h-12 w-full rounded-md border border-input bg-background px-4 py-2 text-base"
                value={stationId}
                onChange={(e) => setStationId(e.target.value)}
                disabled={loading}
              >
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.type}) — {s._count.checkIns} check-ins
                  </option>
                ))}
              </select>
            )}
          </CardContent>
        </Card>

        {/* Scan mode toggle: Camera (if supported) vs Manual */}
        {cameraSupported === true && (
          <div className="mb-4 flex rounded-lg border bg-muted/30 p-1">
            <button
              type="button"
              onClick={() => setScanMode("camera")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md py-3 text-sm font-medium transition-colors ${
                scanMode === "camera"
                  ? "bg-background text-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              disabled={loading || stations.length === 0}
            >
              <ScanLine className="h-5 w-5" />
              Scan QR
            </button>
            <button
              type="button"
              onClick={() => {
                stopCamera();
                setScanMode("manual");
              }}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md py-3 text-sm font-medium transition-colors ${
                scanMode === "manual"
                  ? "bg-background text-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              disabled={loading}
            >
              <Keyboard className="h-5 w-5" />
              Enter code
            </button>
          </div>
        )}

        {cameraSupported === false && (
          <p className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <CameraOff className="h-4 w-4" />
            Camera scan not supported in this browser. Use manual entry below.
          </p>
        )}

        {/* Camera view */}
        {scanMode === "camera" && cameraSupported === true && (
          <Card className="mb-4 overflow-hidden">
            <CardContent className="relative aspect-4/3 bg-black p-0">
              <video
                ref={videoRef}
                playsInline
                muted
                className="h-full w-full object-cover"
                style={{ transform: "scaleX(-1)" }}
              />
              {cameraError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4 text-center text-sm text-white">
                  {cameraError}
                </div>
              )}
              {cameraActive && !cameraError && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-56 w-56 rounded-lg border-4 border-white/50 bg-transparent" />
                </div>
              )}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="absolute bottom-2 right-2"
                onClick={stopCamera}
              >
                Stop camera
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Manual entry form */}
        {(scanMode === "manual" || !cameraSupported) && (
          <form onSubmit={handleCheckIn}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ticket code</CardTitle>
                <CardDescription>
                  Paste the code from the ticket or scan the QR code
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="token">Code</Label>
                  <Input
                    id="token"
                    ref={inputRef}
                    type="text"
                    placeholder="Paste or enter ticket code..."
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    disabled={loading}
                    autoFocus
                    autoComplete="off"
                    className="h-12 text-base"
                  />
                </div>
                {message && (
                  <div
                    className={`rounded-md p-3 text-sm ${
                      message.type === "success"
                        ? "bg-green-500/10 text-green-700 dark:text-green-400"
                        : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {message.text}
                  </div>
                )}
                <Button
                  type="submit"
                  className="h-12 w-full text-base"
                  disabled={loading || stations.length === 0}
                >
                  {loading ? "Checking in..." : "Check in"}
                </Button>
              </CardContent>
            </Card>
          </form>
        )}
      </main>
    </div>
  );
}
