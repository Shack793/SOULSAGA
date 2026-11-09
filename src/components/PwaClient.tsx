"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/**
 * Registers the service worker and shows an install prompt:
 *  - Chrome/Edge on Android: uses the real `beforeinstallprompt` event.
 *  - iOS Safari: there is no install API, so we show "Share → Add to Home Screen" steps.
 */
export default function PwaClient() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [showIos, setShowIos] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
    }

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone || localStorage.getItem("ss-install-dismissed")) return;

    const ua = navigator.userAgent;
    const isIos = /iphone|ipad|ipod/i.test(ua) || (ua.includes("Mac") && navigator.maxTouchPoints > 1);
    if (isIos) {
      setShowIos(true);
      setHidden(false);
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setHidden(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", () => setHidden(true));
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (hidden || (!deferred && !showIos)) return null;

  const dismiss = () => {
    try { localStorage.setItem("ss-install-dismissed", "1"); } catch {}
    setHidden(true);
  };

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-md animate-rise" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="card3d flex items-start gap-3 !bg-ink-800/95 p-4">
        <div className="mt-0.5 rounded-xl bg-saga-600 p-2"><Download size={18} /></div>
        <div className="flex-1 text-sm">
          <p className="font-semibold">Install SoulSaga</p>
          {deferred ? (
            <p className="text-white/60">Add it to your home screen for a faster, app-like experience.</p>
          ) : (
            <p className="text-white/60">
              Tap <Share size={14} className="mx-0.5 inline -translate-y-px" /> then <b>Add to Home Screen</b>.
            </p>
          )}
          {deferred && (
            <button
              className="btn-primary mt-3 !min-h-[40px]"
              onClick={async () => {
                await deferred.prompt();
                await deferred.userChoice;
                setDeferred(null);
                setHidden(true);
              }}
            >
              Install app
            </button>
          )}
        </div>
        <button aria-label="Dismiss" onClick={dismiss} className="p-1 text-white/50 hover:text-white"><X size={18} /></button>
      </div>
    </div>
  );
}
