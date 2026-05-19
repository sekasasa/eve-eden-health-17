import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CHWShell } from "@/components/shells/CHWShell";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { supabase } from "@/integrations/supabase/client";
import { enqueue } from "@/lib/offline-sync";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/chw/register")({
  component: ChwRegister,
});

const RISK_QUESTIONS = [
  { key: "bleeding", label: "Has she had any bleeding?" },
  { key: "headaches", label: "Severe headaches?" },
  { key: "no_movement", label: "Baby NOT moving?" },
  { key: "under_18", label: "Is she under 18?" },
  { key: "chronic", label: "Chronic conditions (diabetes, hypertension)?" },
] as const;

function ChwRegister() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [village, setVillage] = useState("");
  const [district, setDistrict] = useState("");
  const [country, setCountry] = useState("MA");

  // Step 2
  const [dueDate, setDueDate] = useState("");
  const [approxMonth, setApproxMonth] = useState("");
  const [lmp, setLmp] = useState("");
  const [firstPregnancy, setFirstPregnancy] = useState(false);
  const [gravida, setGravida] = useState<number | "">("");
  const [para, setPara] = useState<number | "">("");

  // Step 3
  const [answers, setAnswers] = useState<Record<string, boolean | null>>({});
  const yesCount = Object.values(answers).filter((v) => v === true).length;
  const risk: "low" | "medium" | "high" = yesCount >= 2 ? "high" : yesCount === 1 ? "medium" : "low";

  async function submit() {
    setSaving(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setSaving(false);
      return;
    }
    const payload = {
      chw_id: auth.user.id,
      mother_name: name,
      phone,
      village,
      district,
      country,
      due_date: dueDate || null,
      risk_level: risk,
    };
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      enqueue({ table: "chw_mothers", payload });
      navigate({ to: "/chw/mothers" });
      return;
    }
    const { error } = await supabase.from("chw_mothers").insert(payload);
    setSaving(false);
    if (!error) navigate({ to: "/chw/mothers" });
  }

  return (
    <CHWShell>
      <p className="font-sans text-[10px] uppercase tracking-widest text-eve-muted">
        Step {step} of 3
      </p>
      <h1 className="mt-2 font-serif text-2xl text-eve-teal-dark">
        {step === 1 ? "Basic info" : step === 2 ? "Pregnancy" : "Risk screening"}
      </h1>

      <div className="mt-2 flex gap-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn("h-1 flex-1 rounded-full", i <= step ? "bg-eve-teal" : "bg-gray-200")}
          />
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {step === 1 && (
          <>
            <Field label="Mother's name">
              <input value={name} onChange={(e) => setName(e.target.value)} className={inp} />
            </Field>
            <Field label="Phone">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inp}
              />
            </Field>
            <Field label="Village / neighbourhood">
              <input value={village} onChange={(e) => setVillage(e.target.value)} className={inp} />
            </Field>
            <Field label="District">
              <input value={district} onChange={(e) => setDistrict(e.target.value)} className={inp} />
            </Field>
            <Field label="Country">
              <select value={country} onChange={(e) => setCountry(e.target.value)} className={inp}>
                <option value="MA">Morocco</option>
                <option value="DZ">Algeria</option>
                <option value="TN">Tunisia</option>
                <option value="SN">Senegal</option>
                <option value="CI">Côte d'Ivoire</option>
              </select>
            </Field>
          </>
        )}

        {step === 2 && (
          <>
            <Field label="Due date (if known)">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={inp}
              />
            </Field>
            <Field label="Or approximate month">
              <input
                placeholder="e.g. September"
                value={approxMonth}
                onChange={(e) => setApproxMonth(e.target.value)}
                className={inp}
              />
            </Field>
            <Field label="Last menstrual period">
              <input
                type="date"
                value={lmp}
                onChange={(e) => setLmp(e.target.value)}
                className={inp}
              />
            </Field>
            <label className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2">
              <span className="font-sans text-sm">First pregnancy</span>
              <input
                type="checkbox"
                checked={firstPregnancy}
                onChange={(e) => setFirstPregnancy(e.target.checked)}
                className="h-4 w-4 accent-eve-teal"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Gravida">
                <input
                  type="number"
                  min={0}
                  value={gravida}
                  onChange={(e) => setGravida(e.target.value === "" ? "" : Number(e.target.value))}
                  className={inp}
                />
              </Field>
              <Field label="Para">
                <input
                  type="number"
                  min={0}
                  value={para}
                  onChange={(e) => setPara(e.target.value === "" ? "" : Number(e.target.value))}
                  className={inp}
                />
              </Field>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            {RISK_QUESTIONS.map((q) => (
              <div
                key={q.key}
                className="rounded-md border border-gray-200 p-3"
              >
                <p className="font-sans text-sm text-gray-900">{q.label}</p>
                <div className="mt-2 flex gap-2">
                  {[
                    { v: true, label: "Yes" },
                    { v: false, label: "No" },
                  ].map((opt) => (
                    <button
                      key={String(opt.v)}
                      onClick={() => setAnswers((a) => ({ ...a, [q.key]: opt.v }))}
                      className={cn(
                        "flex-1 rounded-full border px-3 py-1.5 font-sans text-xs",
                        answers[q.key] === opt.v
                          ? opt.v
                            ? "bg-red-500 text-white border-red-500"
                            : "bg-eve-teal text-white border-eve-teal"
                          : "bg-white text-gray-600 border-gray-200",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div
              className={cn(
                "rounded-xl border p-4 text-center",
                risk === "high"
                  ? "border-red-300 bg-red-50"
                  : risk === "medium"
                    ? "border-amber-300 bg-amber-50"
                    : "border-green-200 bg-green-50",
              )}
            >
              <p className="font-sans text-[10px] uppercase tracking-widest text-eve-muted">
                Computed risk
              </p>
              <p
                className={cn(
                  "mt-1 font-serif text-2xl capitalize",
                  risk === "high"
                    ? "text-red-700"
                    : risk === "medium"
                      ? "text-amber-700"
                      : "text-green-700",
                )}
              >
                {risk}
              </p>
            </div>
          </>
        )}
      </div>

      <div className="mt-8 flex gap-3">
        {step > 1 && (
          <SecondaryButton className="flex-1" onClick={() => setStep((s) => s - 1)}>
            Back
          </SecondaryButton>
        )}
        {step < 3 ? (
          <PrimaryButton
            className="flex-1"
            disabled={step === 1 && (!name || !phone)}
            onClick={() => setStep((s) => s + 1)}
          >
            Next
          </PrimaryButton>
        ) : (
          <PrimaryButton className="flex-1" disabled={saving} onClick={submit}>
            {saving ? "Saving…" : "Register mother"}
          </PrimaryButton>
        )}
      </div>
    </CHWShell>
  );
}

const inp =
  "w-full rounded-md border border-gray-200 px-3 py-2 font-sans text-sm focus:border-eve-teal focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block font-sans text-[10px] uppercase tracking-widest text-eve-muted">
        {label}
      </label>
      {children}
    </div>
  );
}
