/**
 * Privacy-safe analytics event names and dispatcher.
 *
 * Hard rule: we never record the text of a health question, a community post,
 * a symptom description, a name, an email, a phone number, or a free-text
 * location. Only enumerated event names and bounded, non-identifying
 * properties (counts, booleans, enum values) are allowed.
 *
 * There is no analytics vendor wired up yet. Events are buffered and, in dev,
 * logged. `setAnalyticsSink` lets a verified backend take over later without
 * changing any call sites.
 */

export const ANALYTICS_EVENTS = {
  signupStarted: "signup_started",
  signupCompleted: "signup_completed",
  onboardingStepViewed: "onboarding_step_viewed",
  onboardingCompleted: "onboarding_completed",
  providerSearchRun: "provider_search_run",
  providerSearchZeroResults: "provider_search_zero_results",
  providerSearchBroadened: "provider_search_broadened",
  providerProfileViewed: "provider_profile_viewed",
  providerContactIntent: "provider_contact_intent",
  eventViewed: "event_viewed",
  eventRegisterIntent: "event_register_intent",
  aiEscalationShown: "ai_escalation_shown",
  featureBlockedByFlag: "feature_blocked_by_flag",
  appError: "app_error",
  homeNeedPromptSelected: "home_need_prompt_selected",
  communityPreviewOpened: "community_preview_opened",
  communityTabSelected: "community_tab_selected",
  communityFilterOpened: "community_filter_opened",
  communityFilterSelected: "community_filter_selected",
  careHubOpened: "care_hub_opened",
  providerPreviewOpened: "provider_preview_opened",
  providerCardOpened: "provider_card_opened",
  providerProfileOpened: "provider_profile_opened",
  providerFollowClicked: "provider_follow_clicked",
  providerServicesOpened: "provider_services_opened",
  askIntentSelected: "ask_intent_selected",
  providerDashboardOpened: "provider_dashboard_opened",
  providerDashboardActionSelected: "provider_dashboard_action_selected",
  communityCareActionSelected: "community_care_action_selected",
  providerDirectoryOpenedFromCommunity: "provider_directory_opened_from_community",
  communityPostOpened: "community_post_opened",
  communityPostDetailViewed: "community_post_detail_viewed",
  communityPersistedFeedLoaded: "community_persisted_feed_loaded",
  communityPersistedPostViewed: "community_persisted_post_viewed",
  communityCreateBlockedReadOnly: "community_create_blocked_read_only",
} as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

/** Only primitives — objects and arrays could smuggle free text. */
export type AnalyticsProps = Record<string, string | number | boolean | null>;

/** Property keys that must never be sent, whatever the caller passes. */
const BLOCKED_KEYS = [
  "message",
  "question",
  "text",
  "body",
  "content",
  "note",
  "notes",
  "email",
  "phone",
  "name",
  "full_name",
  "address",
  "query",
  "symptom",
  "symptoms",
  "diagnosis",
];

const MAX_STRING = 64;

export function sanitizeProps(props: AnalyticsProps = {}): AnalyticsProps {
  const out: AnalyticsProps = {};
  for (const [key, value] of Object.entries(props)) {
    if (BLOCKED_KEYS.includes(key.toLowerCase())) continue;
    if (value === null || typeof value === "number" || typeof value === "boolean") {
      out[key] = value;
      continue;
    }
    if (typeof value === "string") {
      // Bound the length so no free text can slip through a permitted key.
      out[key] = value.slice(0, MAX_STRING);
    }
  }
  return out;
}

type Sink = (event: AnalyticsEvent, props: AnalyticsProps) => void;

let sink: Sink | null = null;
const buffer: { event: AnalyticsEvent; props: AnalyticsProps; at: number }[] = [];
const MAX_BUFFER = 100;

export function setAnalyticsSink(next: Sink | null) {
  sink = next;
}

export function track(event: AnalyticsEvent, props: AnalyticsProps = {}) {
  const safe = sanitizeProps(props);
  if (sink) {
    try {
      sink(event, safe);
    } catch {
      /* analytics must never break the app */
    }
    return;
  }
  buffer.push({ event, props: safe, at: Date.now() });
  if (buffer.length > MAX_BUFFER) buffer.shift();
  if (typeof import.meta !== "undefined" && import.meta.env?.DEV) {
    console.debug("[analytics]", event, safe);
  }
}

/** Structured, privacy-safe error logging hook. */
export function trackError(scope: string, error: unknown) {
  const name = error instanceof Error ? error.name : "UnknownError";
  // Message text can contain user input from validation errors — record only
  // a coarse shape, never the message itself.
  track(ANALYTICS_EVENTS.appError, { scope, error_name: name });
}

/** Test/diagnostics helper. */
export function drainBuffer() {
  return buffer.splice(0, buffer.length);
}
