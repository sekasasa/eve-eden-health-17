import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import { useEffect } from "react";
import appCss from "../styles.css?url";
import { DemoBanner } from "@/components/ui/DemoBanner";
import { InstallPrompt } from "@/components/ui/InstallPrompt";
import { Toaster } from "@/components/ui/sonner";
import { initPwaInstall } from "@/lib/pwa-install";
import { useLanguage } from "@/hooks/useLanguage";
import "@/i18n";


function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content:
          "width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1",
      },
      { title: "Eve & Eden Health — Maternal care navigation" },
      { name: "description", content: "Personalized maternal care navigation for every stage, culture, and country. Find support for fertility, pregnancy, postpartum, providers, community, events, and care preferences." },
      { name: "theme-color", content: "#0E7C7B" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "Eve" },
      { property: "og:title", content: "Eve & Eden Health — Maternal care navigation" },
      { property: "og:description", content: "Personalized maternal care navigation for every stage, culture, and country. Find support for fertility, pregnancy, postpartum, providers, community, events, and care preferences." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Eve & Eden Health — Maternal care navigation" },
      { name: "twitter:description", content: "Personalized maternal care navigation for every stage, culture, and country. Find support for fertility, pregnancy, postpartum, providers, community, events, and care preferences." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/36c5a505-8084-4d53-9ec6-d199aad4450b/id-preview-da0fa383--13e2c94b-074f-431a-91fa-7d0caa50d651.lovable.app-1782493673671.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/36c5a505-8084-4d53-9ec6-d199aad4450b/id-preview-da0fa383--13e2c94b-074f-431a-91fa-7d0caa50d651.lovable.app-1782493673671.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/icon-192.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  // Hydrate language + RTL direction app-wide on first paint
  useLanguage();

  useEffect(() => {
    initPwaInstall();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <DemoBanner />
      <Outlet />
      <InstallPrompt />
      <Toaster position="top-right" richColors closeButton />
    </QueryClientProvider>
  );
}

