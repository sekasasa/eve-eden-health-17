import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UpcomingAppointment = {
  id: string;
  scheduled_at: string;
  type: string | null;
  status: string | null;
  providerName: string | null;
};

export type UpcomingEvent = {
  id: string;
  title: string;
  event_at: string | null;
  location: string | null;
};

/**
 * Real upcoming items only: persisted appointments for the signed-in mother
 * plus published events. Never synthesises placeholder entries.
 */
export function useUpcoming(limit = 3) {
  const [appointments, setAppointments] = useState<UpcomingAppointment[]>([]);
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const nowIso = new Date().toISOString();

      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (uid) {
        const { data: mother } = await supabase
          .from("mothers")
          .select("id")
          .eq("user_id", uid)
          .maybeSingle();
        if (mother?.id) {
          const { data } = await supabase
            .from("appointments")
            .select("id,scheduled_at,type,status,provider:providers(full_name)")
            .eq("mother_id", mother.id)
            .gte("scheduled_at", nowIso)
            .order("scheduled_at", { ascending: true })
            .limit(limit);
          if (!cancelled) {
            setAppointments(
              ((data ?? []) as unknown as {
                id: string;
                scheduled_at: string;
                type: string | null;
                status: string | null;
                provider: { full_name: string | null } | null;
              }[])
                .filter((a) => a.status !== "cancelled")
                .map((a) => ({
                  id: a.id,
                  scheduled_at: a.scheduled_at,
                  type: a.type,
                  status: a.status,
                  providerName: a.provider?.full_name ?? null,
                })),
            );
          }
        }
      }

      const { data: ev } = await supabase
        .from("vendor_content")
        .select("id,title,event_at,location")
        .eq("content_type", "event")
        .eq("status", "published")
        .gte("event_at", nowIso)
        .order("event_at", { ascending: true })
        .limit(limit);
      if (cancelled) return;
      setEvents((ev ?? []) as unknown as UpcomingEvent[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [limit]);

  return { appointments, events, loading };
}
