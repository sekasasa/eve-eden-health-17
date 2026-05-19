/**
 * Lightweight "Add to Home Screen" helper.
 * - Counts visits in localStorage
 * - Captures the beforeinstallprompt event (Chrome/Android)
 * - Exposes a promise-based prompt() the UI can trigger after the 3rd visit
 *
 * Note: No service worker is registered here. PWA install is supported by
 * browsers even without a SW as long as a valid manifest is linked.
 */
const VISIT_KEY = "eve_visit_count";
const DISMISSED_KEY = "eve_install_dismissed";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferred: BIPEvent | null = null;

export function initPwaInstall() {
  if (typeof window === "undefined") return;
  try {
    const n = Number(localStorage.getItem(VISIT_KEY) ?? "0") + 1;
    localStorage.setItem(VISIT_KEY, String(n));
  } catch {
    /* ignore */
  }
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as BIPEvent;
  });
}

export function visitCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    return Number(localStorage.getItem(VISIT_KEY) ?? "0");
  } catch {
    return 0;
  }
}

export function shouldShowInstallPrompt(): boolean {
  if (typeof window === "undefined") return false;
  if (localStorage.getItem(DISMISSED_KEY)) return false;
  const standalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari
    (navigator as unknown as { standalone?: boolean }).standalone === true;
  if (standalone) return false;
  return visitCount() >= 3 && deferred !== null;
}

export async function promptInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
  if (!deferred) return "unavailable";
  try {
    await deferred.prompt();
    const choice = await deferred.userChoice;
    deferred = null;
    return choice.outcome;
  } catch {
    return "dismissed";
  }
}

export function dismissInstall() {
  if (typeof window === "undefined") return;
  localStorage.setItem(DISMISSED_KEY, "1");
}
