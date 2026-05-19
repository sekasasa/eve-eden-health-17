import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { dismissInstall, promptInstall, shouldShowInstallPrompt } from "@/lib/pwa-install";

export function InstallPrompt() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setOpen(shouldShowInstallPrompt()), 1500);
    return () => window.clearTimeout(t);
  }, []);

  if (!open) return null;

  const close = () => {
    dismissInstall();
    setOpen(false);
  };

  return (
    <div className="fixed inset-x-3 bottom-24 z-50 mx-auto max-w-sm rounded-2xl bg-white p-4 shadow-xl ring-1 ring-black/5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-eve-teal text-white">
          <Download className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <p className="font-sans text-sm font-semibold text-eve-forest">Add Eve to your home screen</p>
          <p className="mt-0.5 font-sans text-xs text-eve-muted">Faster access, works offline.</p>
        </div>
        <button
          onClick={close}
          aria-label="Dismiss"
          className="flex h-11 w-11 items-center justify-center -m-2 text-eve-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <button
        onClick={async () => {
          await promptInstall();
          setOpen(false);
        }}
        className="mt-3 h-11 w-full rounded-full bg-eve-teal font-sans text-sm font-medium text-white"
      >
        Install
      </button>
    </div>
  );
}
