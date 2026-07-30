import { beforeEach, describe, expect, it } from "vitest";
import {
  isCommunityReadOnly,
  isReported,
  readReports,
  reportAcknowledgement,
  submitReport,
} from "@/lib/moderation";

function fakeStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
  };
}

let storage: ReturnType<typeof fakeStorage>;
beforeEach(() => {
  storage = fakeStorage();
});

describe("report state", () => {
  it("starts empty", () => {
    expect(readReports(storage)).toEqual({});
  });

  it("records and reads back a report", () => {
    const store = submitReport("post-1", "harmful_advice", storage);
    expect(isReported("post-1", store)).toBe(true);
    expect(isReported("post-2", store)).toBe(false);
    expect(readReports(storage)["post-1"].reason).toBe("harmful_advice");
  });

  it("survives corrupt storage without throwing", () => {
    storage.setItem("eve.community.reports.v1", "{not json");
    expect(readReports(storage)).toEqual({});
  });
});

describe("isCommunityReadOnly", () => {
  it("is read-only with default flags", () => {
    expect(isCommunityReadOnly({})).toBe(true);
  });

  it("stays read-only when posting is on but moderation is off", () => {
    expect(isCommunityReadOnly({ VITE_FLAG_COMMUNITY_POSTING: "on" })).toBe(true);
  });

  it("allows posting only when posting and moderation are both on", () => {
    expect(
      isCommunityReadOnly({
        VITE_FLAG_COMMUNITY_POSTING: "on",
        VITE_FLAG_COMMUNITY_MODERATION: "on",
      }),
    ).toBe(false);
  });
});

describe("reportAcknowledgement", () => {
  it("never claims review when moderation is off", () => {
    const copy = reportAcknowledgement({});
    expect(copy).toMatch(/no one has reviewed/i);
  });

  it("mentions the queue when moderation is on", () => {
    expect(reportAcknowledgement({ VITE_FLAG_COMMUNITY_MODERATION: "on" })).toMatch(
      /moderator/i,
    );
  });
});
