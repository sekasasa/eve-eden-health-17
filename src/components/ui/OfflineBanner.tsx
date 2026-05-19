import { useEffect, useState } from "react";
import { flush, queueLength } from "@/lib/offline-sync";

export function OfflineBanner() {
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    const update = () => {
      setOnline(navigator.onLine);
      setPending(queueLength());
    };
    update();
    const onOnline = async () => {
      setOnline(true);
      const { flushed } = await flush();
      setPending(queueLength());
      if (flushed > 0) {
        // brief visual cue handled by re-render
      }
    };
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    const interval = window.setInterval(() => setPending(queueLength()), 4000);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.clearInterval(interval);
    };
  }, []);

  if (online && pending === 0) return null;
  return (
    <div
      role="status"
      className={
        "fixed inset-x-0 top-0 z-[60] flex h-8 items-center justify-center px-5 font-sans text-xs " +
        (online ? "bg-eve-teal/10 text-eve-teal-dark" : "bg-amber-100 text-amber-900")
      }
    >
      {online
        ? `Syncing ${pending} pending ${pending === 1 ? "entry" : "entries"}…`
        : "You are offline — data syncs when you reconnect."}
    </div>
  );
}
