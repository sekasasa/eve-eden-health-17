import { createFileRoute, Link } from "@tanstack/react-router";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { CONSENT_VERSIONS } from "@/lib/consent";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Notice — Eve & Eden Health" },
      {
        name: "description",
        content:
          "How Eve & Eden Health collects, uses and protects your information, including health-related details you choose to share.",
      },
      { property: "og:title", content: "Privacy Notice — Eve & Eden Health" },
      {
        property: "og:description",
        content: "How Eve & Eden Health handles your personal and health-related information.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <main className="min-h-dvh bg-eve-sand px-6 py-12">
      <article className="mx-auto w-full max-w-2xl">
        <SectionLabel>Legal</SectionLabel>
        <h1 className="mt-2 font-serif text-4xl text-eve-teal">Privacy Notice</h1>
        <p className="mt-2 font-sans text-xs text-eve-muted">Version {CONSENT_VERSIONS.privacy}</p>

        <div className="mt-6 space-y-5 font-sans text-sm leading-relaxed text-eve-muted">
          <section>
            <h2 className="font-serif text-xl text-eve-teal">What we collect</h2>
            <p className="mt-2">
              Account details you give us (name, email, role), the care preferences you choose to
              save, and anything you deliberately add such as notes or documents. Sharing sensitive
              details — including anything about religion, culture, or diet — is always optional.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-eve-teal">How we use it</h2>
            <p className="mt-2">
              To run your account, personalise the guidance and provider results you see, and
              improve the product. Your saved preferences are used to rank and explain results —
              they are never shown to other members.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-eve-teal">Measurement</h2>
            <p className="mt-2">
              We record privacy-safe usage events such as “a search returned no results”. We do not
              record the text of your questions, posts, or symptom descriptions in analytics.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-eve-teal">Sharing</h2>
            <p className="mt-2">
              We do not sell your information. Details are only shared with a provider when you
              explicitly choose to share them, and you can withdraw that sharing.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-eve-teal">Your choices</h2>
            <p className="mt-2">
              You can review or edit your care preferences at any time, ask for a copy of your data,
              or ask us to delete your account. Contact us from within the app to make a request.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-eve-teal">Consent records</h2>
            <p className="mt-2">
              When you create an account we store which version of the terms, this notice, and the
              medical disclaimer you agreed to, together with the time you agreed.
            </p>
          </section>
        </div>

        <p className="mt-8 font-sans text-sm">
          <Link to="/terms" className="text-eve-teal underline">
            Read the terms of use
          </Link>
        </p>
      </article>
    </main>
  );
}
