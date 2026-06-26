import { useEffect, useRef, useState } from "react";
import {
  createFileRoute,
  Link,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  Info,
  ArrowUp,
  Mic,
  AlertTriangle,
  Stethoscope,
  X,
} from "lucide-react";
import { BottomNav } from "@/components/ui/BottomNav";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { supabase } from "@/integrations/supabase/client";
import { askEve } from "@/lib/ask-eve.functions";
import { cn } from "@/lib/utils";
import { useCarePreferences } from "@/hooks/useCarePreferences";
import {
  emergencyContact,
  suggestedPromptsFromPrefs,
} from "@/lib/personalization";

export const Route = createFileRoute("/eve/ask")({
  component: AskEvePage,
});

type PreferredProvider = {
  id: string;
  full_name: string | null;
  phone: string | null;
};

type Msg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  urgent?: boolean;
  suggestProvider?: boolean;
  createdAt: number;
};

const URGENT_KEYWORDS = [
  "bleeding",
  "saigne",
  "saignement",
  "severe pain",
  "douleur sévère",
  "douleur intense",
  "no movement",
  "ne bouge",
  "emergency",
  "urgence",
  "fainting",
  "evanou",
  "contractions",
  "water broke",
  "perte des eaux",
];

const PROVIDER_HINTS = [
  "doctor",
  "provider",
  "clinic",
  "médecin",
  "docteur",
  "consult",
  "obstétric",
  "ob-gyn",
];

type QuickReply = { label: string; chip: string };

const QUICK_REPLIES: QuickReply[] = [
  { chip: "Symptoms", label: "I have a symptom I want to understand" },
  { chip: "Appointment prep", label: "Help me prepare for my appointment" },
  { chip: "Food & supplements", label: "What can I eat? What supplements are safe?" },
  { chip: "Labs", label: "Help me understand a lab result" },
  { chip: "Prescriptions", label: "I have a question about a prescription" },
  { chip: "Insurance", label: "Help me figure out insurance or payment" },
  { chip: "Emotional support", label: "I need emotional support" },
  { chip: "Provider search", label: "Help me find the right provider" },
];

function isUrgent(text: string) {
  const t = text.toLowerCase();
  return URGENT_KEYWORDS.some((k) => t.includes(k));
}

function suggestsProvider(text: string) {
  const t = text.toLowerCase();
  return PROVIDER_HINTS.some((k) => t.includes(k));
}

function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AskEvePage() {
  return (
    <ProtectedRoute requiredType="mother">
      <AskEveInner />
    </ProtectedRoute>
  );
}

function AskEveInner() {
  const router = useRouter();
  const navigate = useNavigate();
  const askFn = useServerFn(askEve);
  const { prefs } = useCarePreferences();
  const emergency = emergencyContact(prefs.country);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [profile, setProfile] = useState<{
    pregnancy_week: number | null;
    language: string | null;
    dietary_notes: string | null;
    country: string | null;
  } | null>(null);
  const [preferredProvider, setPreferredProvider] =
    useState<PreferredProvider | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return;
      const { data: m } = await supabase
        .from("mothers")
        .select("pregnancy_week, language, dietary_notes, country, preferred_provider_id")
        .eq("user_id", uid)
        .maybeSingle();
      if (m) {
        setProfile(m as any);
        const pid = (m as any).preferred_provider_id as string | null;
        if (pid) {
          const { data: p } = await supabase
            .from("providers")
            .select("id, full_name, phone")
            .eq("id", pid)
            .maybeSingle();
          if (p) setPreferredProvider(p as PreferredProvider);
        }
      }
    })();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, pending]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || pending) return;
    const urgent = isUrgent(trimmed); // urgency derived ONLY from user message
    const userMsg: Msg = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      urgent,
      createdAt: Date.now(),
    };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput("");
    setPending(true);

    const history = messages.slice(-10).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const res = await askFn({
      data: {
        message: trimmed,
        pregnancy_week: profile?.pregnancy_week ?? null,
        language: profile?.language ?? prefs.language ?? null,
        dietary_pref: profile?.dietary_notes ?? null,
        country: profile?.country ?? prefs.country ?? null,
        prefs: {
          stage: prefs.stage,
          region: prefs.region,
          city: prefs.city,
          dialect: prefs.dialect,
          cultural: prefs.cultural_prefs,
          dietary: prefs.dietary_prefs,
          birth: prefs.birth_prefs,
        },
        history,
      },
    });

    const replyText =
      res.reply ??
      res.error ??
      "Sorry, Eve couldn't reply just now.";
    const reply: Msg = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: replyText,
      suggestProvider: suggestsProvider(replyText),
      createdAt: Date.now(),
    };
    setMessages((cur) => [...cur, reply]);
    setPending(false);
  };

  return (
    <div className="min-h-dvh bg-eve-sand">
      <div className="mx-auto flex min-h-dvh max-w-sm flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-eve-muted/15 bg-eve-sand/95 px-3 py-3 backdrop-blur">
          <button
            aria-label="Back"
            onClick={() => router.history.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-eve-cream text-eve-teal-dark"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex flex-col items-center">
            <h1 className="font-serif text-lg leading-none text-eve-teal-dark">
              Ask Eve
            </h1>
            <span
              className="mt-0.5 rounded-full bg-eve-rose/10 px-2 py-[1px] font-sans text-eve-rose"
              style={{ fontSize: "9px" }}
            >
              AI-assisted
            </span>
          </div>
          <button
            aria-label="Info"
            onClick={() => setShowDisclaimer(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-eve-cream text-eve-teal-dark"
          >
            <Info className="h-4 w-4" />
          </button>
        </header>

        {/* Thin persistent safety banner */}
        <div className="border-b border-eve-muted/10 bg-eve-cream/60 px-3 py-2 text-center">
          <p className="font-sans text-eve-teal-dark" style={{ fontSize: "10.5px", lineHeight: 1.4 }}>
            Eve can help you prepare, understand your options, and find support. Eve does not diagnose or replace medical care.
          </p>
        </div>

        {/* Thread */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-3 pb-40 pt-4"
        >
          {messages.length === 0 ? (
            <WelcomeState
              onPick={send}
              extraPrompts={suggestedPromptsFromPrefs(prefs)}
            />
          ) : (
            <div className="space-y-3">
              {messages.map((m) => (
                <MessageBubble
                  key={m.id}
                  msg={m}
                  preferredProvider={preferredProvider}
                  emergencyNumber={emergency.number}
                  emergencyLabel={emergency.label}
                  onFindProvider={() => navigate({ to: "/eve/providers" })}
                />
              ))}
              {pending && <TypingIndicator />}
            </div>
          )}
        </div>

        {/* Input bar (above BottomNav) */}
        <div className="fixed bottom-20 left-1/2 z-40 w-full max-w-sm -translate-x-1/2 border-t border-eve-muted/20 bg-eve-cream px-3 py-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2"
          >
            <button
              type="button"
              aria-label="Voice input coming soon"
              title="Voice input coming soon"
              disabled
              className="flex h-9 w-9 shrink-0 cursor-not-allowed items-center justify-center rounded-full bg-white text-eve-muted opacity-50"
            >
              <Mic className="h-4 w-4" />
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Eve anything..."
              className="flex-1 rounded-full bg-white px-4 py-2 font-sans text-sm text-eve-teal-dark placeholder:text-eve-muted focus:outline-none focus:ring-2 focus:ring-eve-teal/30"
              maxLength={1000}
              disabled={pending}
            />
            <button
              type="submit"
              aria-label="Send"
              disabled={pending || !input.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-eve-teal text-white disabled:opacity-50"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </form>
        </div>

        <BottomNav />
      </div>

      {showDisclaimer && (
        <DisclaimerModal onClose={() => setShowDisclaimer(false)} />
      )}
    </div>
  );
}

function WelcomeState({ onPick }: { onPick: (q: string) => void }) {
  return (
    <div>
      <div className="flex items-start gap-2">
        <EveAvatar />
        <div className="max-w-[78%] rounded-2xl rounded-tl-sm border border-eve-muted/20 bg-eve-cream p-3">
          <p
            className="font-sans text-eve-teal-dark"
            style={{ fontSize: "13px", lineHeight: "1.45" }}
          >
            Marhaban! I'm Eve — your maternal care guide. I can help you prepare for appointments, understand your options, organize questions, find trusted providers, and feel supported. What would you like help with today?
          </p>
          <p
            className="mt-2 font-sans italic text-eve-muted"
            style={{ fontSize: "10px" }}
          >
            Eve provides general information only. Always consult your provider for medical decisions.
          </p>
        </div>
      </div>
      <div className="mt-4 pl-10">
        <p className="mb-2 font-sans uppercase tracking-widest text-eve-muted" style={{ fontSize: "9.5px" }}>
          What can Eve help with
        </p>
        <div className="flex flex-wrap gap-2">
          {QUICK_REPLIES.map((q) => (
            <button
              key={q.chip}
              onClick={() => onPick(q.label)}
              className="rounded-full border border-eve-teal/30 bg-white px-3 py-1.5 font-sans text-eve-teal"
              style={{ fontSize: "12px" }}
            >
              {q.chip}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  msg,
  preferredProvider,
  onFindProvider,
}: {
  msg: Msg;
  preferredProvider: PreferredProvider | null;
  onFindProvider: () => void;
}) {
  if (msg.role === "user") {
    return (
      <div className="flex flex-col items-end">
        {/* Urgency banner triggered ONLY by user message keyword */}
        {msg.urgent && (
          <div className="mb-2 w-full">
            <UrgencyCard preferredProvider={preferredProvider} />
          </div>
        )}
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-eve-rose px-3 py-2 text-white">
          <p
            className="font-sans"
            style={{ fontSize: "13px", lineHeight: "1.45" }}
          >
            {msg.content}
          </p>
        </div>
        <span
          className="mt-1 font-sans text-eve-muted"
          style={{ fontSize: "10px" }}
        >
          {fmtTime(msg.createdAt)}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start">
      <div className="flex items-start gap-2">
        <EveAvatar />
        <div className="max-w-[78%] space-y-2">
          <div className="rounded-2xl rounded-tl-sm border border-eve-muted/20 bg-eve-cream p-3">
            <p
              className="font-sans text-eve-teal-dark"
              style={{ fontSize: "13px", lineHeight: "1.45" }}
            >
              {msg.content}
            </p>
          </div>
          {msg.suggestProvider && (
            <button
              onClick={onFindProvider}
              className="flex w-full items-center justify-between rounded-2xl border border-eve-teal/30 bg-eve-teal-light p-3 text-left"
            >
              <span className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-eve-teal" />
                <span
                  className="font-sans font-medium text-eve-teal-dark"
                  style={{ fontSize: "12px" }}
                >
                  Would you like me to find a provider near you?
                </span>
              </span>
              <span
                className="rounded-full bg-eve-teal px-3 py-1 font-sans text-white"
                style={{ fontSize: "11px" }}
              >
                Find
              </span>
            </button>
          )}
        </div>
      </div>
      <span
        className="ml-10 mt-1 font-sans text-eve-muted"
        style={{ fontSize: "10px" }}
      >
        {fmtTime(msg.createdAt)}
      </span>
    </div>
  );
}

function UrgencyCard({ preferredProvider }: { preferredProvider: PreferredProvider | null }) {
  const hasProviderPhone =
    !!preferredProvider && !!preferredProvider.phone && preferredProvider.phone.trim().length > 0;
  const dialNumber = hasProviderPhone
    ? preferredProvider!.phone!.trim()
    : EMERGENCY_NUMBER;
  const buttonLabel = hasProviderPhone
    ? `Call ${preferredProvider!.full_name ?? "your doctor"}`
    : "Call emergency services";

  return (
    <div className="rounded-2xl border border-red-300 bg-red-50 p-3">
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
        <div className="flex-1">
          <p
            className="font-sans font-medium text-red-700"
            style={{ fontSize: "12px" }}
          >
            This sounds urgent. Please get medical help right away.
          </p>
          {/* dialNumber is guaranteed non-empty: provider phone OR EMERGENCY_NUMBER */}
          <a
            href={`tel:${dialNumber}`}
            className="mt-2 inline-flex items-center rounded-full bg-eve-rose px-3 py-1.5 font-sans font-medium text-white"
            style={{ fontSize: "11px" }}
          >
            {buttonLabel}
          </a>
          {!hasProviderPhone && (
            <p
              className="mt-2 font-sans text-red-700/80"
              style={{ fontSize: "10.5px", lineHeight: 1.4 }}
            >
              Or go to your nearest clinic or emergency department.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-2">
      <EveAvatar />
      <div className="rounded-2xl rounded-tl-sm border border-eve-muted/20 bg-eve-cream px-4 py-3">
        <div className="flex items-center gap-1">
          <Dot delay="0ms" />
          <Dot delay="150ms" />
          <Dot delay="300ms" />
        </div>
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="h-2 w-2 animate-bounce rounded-full bg-eve-teal"
      style={{ animationDelay: delay }}
    />
  );
}

function EveAvatar() {
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-eve-teal">
      <span className="font-serif text-white" style={{ fontSize: "13px" }}>
        E
      </span>
    </div>
  );
}

function DisclaimerModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-3 pb-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 className="font-serif text-xl text-eve-teal-dark">
            About Eve
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-eve-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-3 font-sans text-sm text-eve-teal-dark">
          Eve is your maternal care guide. She can help you prepare for appointments, understand your care options, organize questions, navigate insurance, and find trusted providers and emotional support.
        </p>
        <p className="mt-2 font-sans text-sm text-eve-muted">
          Eve does not diagnose conditions or prescribe medication. For any medical decision, please consult a qualified provider. In an emergency, call your doctor or {EMERGENCY_NUMBER}.
        </p>
        <button
          onClick={onClose}
          className="mt-5 w-full rounded-full bg-eve-teal py-3 font-sans font-medium text-white"
        >
          I understand
        </button>
        <Link
          to="/eve/providers"
          className="mt-2 block text-center font-sans text-sm text-eve-teal"
        >
          Find a provider near me
        </Link>
      </div>
    </div>
  );
}
