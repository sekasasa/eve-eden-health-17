import { describe, expect, it } from "vitest";
import {
  ANALYTICS_EVENTS,
  drainBuffer,
  sanitizeProps,
  setAnalyticsSink,
  track,
  trackError,
} from "./analytics";

describe("sanitizeProps", () => {
  it("drops keys that could carry health or identifying free text", () => {
    const out = sanitizeProps({
      question: "am I bleeding too much",
      email: "a@b.com",
      symptom: "cramping",
      city_known: true,
      results_count: 0,
    });
    expect(out).toEqual({ city_known: true, results_count: 0 });
  });

  it("bounds the length of allowed strings", () => {
    const out = sanitizeProps({ stage: "x".repeat(500) });
    expect((out.stage as string).length).toBe(64);
  });
});

describe("track", () => {
  it("buffers events when no sink is registered", () => {
    setAnalyticsSink(null);
    drainBuffer();
    track(ANALYTICS_EVENTS.providerSearchZeroResults, { results_count: 0 });
    const drained = drainBuffer();
    expect(drained).toHaveLength(1);
    expect(drained[0].event).toBe("provider_search_zero_results");
  });

  it("sends sanitized props to a registered sink", () => {
    const seen: { event: string; props: Record<string, unknown> }[] = [];
    setAnalyticsSink((event, props) => seen.push({ event, props }));
    track(ANALYTICS_EVENTS.aiEscalationShown, {
      category: "severe_bleeding",
      message: "leaked text",
    });
    setAnalyticsSink(null);
    expect(seen[0].props).toEqual({ category: "severe_bleeding" });
  });

  it("never throws when the sink throws", () => {
    setAnalyticsSink(() => {
      throw new Error("boom");
    });
    expect(() => track(ANALYTICS_EVENTS.appError)).not.toThrow();
    setAnalyticsSink(null);
  });

  it("records only the error name, never the message", () => {
    const seen: Record<string, unknown>[] = [];
    setAnalyticsSink((_e, props) => seen.push(props));
    trackError("ask_eve", new TypeError("patient said something private"));
    setAnalyticsSink(null);
    expect(seen[0]).toEqual({ scope: "ask_eve", error_name: "TypeError" });
  });
});
