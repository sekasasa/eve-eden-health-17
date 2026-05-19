import { supabase } from "@/integrations/supabase/client";

type QueueItem = {
  id: string;
  table: "chw_mothers" | "visits" | "chw_alerts";
  payload: Record<string, unknown>;
  follow_up?: { table: "chw_mothers"; id_field: "id"; id_from?: "payload.mother_id"; patch: Record<string, unknown> };
};

const KEY = "chw_offline_queue_v1";

function read(): QueueItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

function write(items: QueueItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function queueLength() {
  return read().length;
}

export function enqueue(item: Omit<QueueItem, "id">) {
  const items = read();
  items.push({ id: crypto.randomUUID(), ...item });
  write(items);
}

export async function flush(): Promise<{ flushed: number; failed: number }> {
  if (typeof window === "undefined") return { flushed: 0, failed: 0 };
  if (!navigator.onLine) return { flushed: 0, failed: 0 };
  const items = read();
  if (items.length === 0) return { flushed: 0, failed: 0 };
  const remaining: QueueItem[] = [];
  let flushed = 0;
  for (const item of items) {
    try {
      const { error } = await supabase.from(item.table).insert(item.payload);
      if (error) throw error;
      if (item.follow_up) {
        const motherId = (item.payload as Record<string, unknown>).mother_id as string | undefined;
        if (motherId) {
          await supabase.from(item.follow_up.table).update(item.follow_up.patch).eq("id", motherId);
        }
      }
      flushed++;
    } catch {
      remaining.push(item);
    }
  }
  write(remaining);
  return { flushed, failed: remaining.length };
}
