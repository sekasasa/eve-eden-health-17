import { createFileRoute, Link } from "@tanstack/react-router";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { CONSENT_VERSIONS } from "@/lib/consent";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Use — Eve & Eden Health" },
      {
        name: "description",
        content:
          "The terms that govern your use of Eve & Eden Health, including what the service does and does not provide.",
      },
      { property: "og:title", content: "Terms of Use — Eve & Eden Health" },
      {
        property: "og:description",
        content: "Terms governing the use of Eve & Eden Health maternal care navigation.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <main className="min-h-dvh bg-eve-sand px-6 py-12">
      <article className="mx-auto w-full max-w-2xl">
        <SectionLabel>Legal</SectionLabel>
        <h1 className="mt-2 font-serif text-4xl text-eve-teal">Terms of Use</h1>
        <p className="mt-2 font-sans text-xs text-eve-muted">Version {CONSENT_VERSIONS.terms}</p>

        <div className="mt-6 space-y-5 font-sans text-sm leading-relaxed text-eve-muted">
          <section>
            <h2 className="font-serif text-xl text-eve-teal">What Eve &amp; Eden is</h2>
            <p className="mt-2">
              Eve &amp; Eden Health is a maternal care navigation service. It helps you find
              providers, understand options, and organise your own information. It is an information
              and navigation tool, not a medical provider.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-eve-teal">Medical disclaimer</h2>
            <p className="mt-2">
              Nothing in the app is medical advice, diagnosis, or treatment, and nothing here
              creates a clinician–patient relationship. Always speak with a qualified clinician
              about your own care. If you think you may be experiencing an emergency, contact your
              local emergency services immediately.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-eve-teal">Provider and vendor listings</h2>
            <p className="mt-2">
              Listings are gathered from public sources and from providers themselves. A listing is
              not an endorsement, and we do not guarantee availability, credentials, pricing, or
              insurance coverage. Verify details directly with the provider and your insurer before
              relying on them.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-eve-teal">Your account</h2>
            <p className="mt-2">
              Keep your login details private and give accurate information when you create an
              account. You may close your account at any time.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-eve-teal">Changes</h2>
            <p className="mt-2">
              We record which version of these terms you agreed to and when. If the terms change
              materially, we will ask you to review them again.
            </p>
          </section>
        </div>

        <p className="mt-8 font-sans text-sm">
          <Link to="/privacy" className="text-eve-teal underline">
            Read the privacy notice
          </Link>
        </p>
      </article>
    </main>
  );
}
