import { supabase } from "@/integrations/supabase/client";
import { enterDemoServer } from "@/lib/demo.functions";
import type { DemoRole } from "@/demo-data";

const KEY = "eve_demo_mode";

export function getDemoMode(): DemoRole | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(KEY);
  return v === "mother" || v === "provider" ? v : null;
}

export async function enterDemo(role: DemoRole): Promise<void> {
  const { email, password } = await enterDemoServer({ data: { role } });
  // Sign out any existing session first to avoid stale tokens
  await supabase.auth.signOut().catch(() => {});
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  window.localStorage.setItem(KEY, role);
}

export async function exitDemo(): Promise<void> {
  await supabase.auth.signOut().catch(() => {});
  window.localStorage.removeItem(KEY);
}
