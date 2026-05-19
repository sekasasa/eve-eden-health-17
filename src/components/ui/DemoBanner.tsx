import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { exitDemo, getDemoMode } from "@/lib/demo";
import type { DemoRole } from "@/demo-data";

export function DemoBanner() {
  const [role, setRole] = useState<DemoRole | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setRole(getDemoMode());
    const handler = () => setRole(getDemoMode());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  if (!role) return null;

  async function handleReset() {
    await exitDemo();
    setRole(null);
    navigate({ to: "/" });
  }

  return (
    <>
      <div
        className="fixed inset-x-0 top-0 z-[100] flex h-8 items-center justify-center gap-3 bg-amber-400 px-4 font-sans text-[12px] text-amber-950 shadow-sm"
        role="status"
      >
        <span className="font-medium">Demo mode — this data is not real.</span>
        <button
          onClick={() => navigate({ to: "/signup" })}
          className="underline underline-offset-2 hover:text-amber-900"
        >
          Sign up
        </button>
        <span className="opacity-50">·</span>
        <button
          onClick={handleReset}
          className="underline underline-offset-2 hover:text-amber-900"
        >
          Reset demo
        </button>
      </div>
      {/* Spacer so fixed banner does not overlap content */}
      <div aria-hidden className="h-8" />
    </>
  );
}
