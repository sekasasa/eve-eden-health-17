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
      className={
        "px-5 py-2 text-center font-sans text-xs " +
        (online ? "bg-eve-teal/10 text-eve-teal-dark" : "bg-amber-100 text-amber-900")
      }
    >
      {online
        ? `Syncing ${pending} pending ${pending === 1 ? "entry" : "entries"}…`
        : "No internet? Your data syncs when you reconnect."}
    </div>
  );
}
