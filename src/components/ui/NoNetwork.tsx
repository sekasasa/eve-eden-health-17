import { WifiOff } from "lucide-react";
import { Link } from "@tanstack/react-router";

type NoNetworkProps = {
  onRetry?: () => void;
  cachedHref?: string;
};

export function NoNetwork({ onRetry, cachedHref = "/eve/home" }: NoNetworkProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-eve-teal-light">
        <WifiOff className="size-8 text-eve-teal" />
      </div>
      <h2 className="mt-5 font-serif text-2xl text-eve-forest">
        No internet connection
      </h2>
      <p className="mt-2 max-w-xs text-sm text-eve-muted">
        Eve works offline for content you have already viewed.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => (onRetry ? onRetry() : window.location.reload())}
          className="inline-flex h-11 items-center justify-center rounded-full bg-eve-teal px-5 text-sm font-medium text-white transition-colors hover:bg-eve-teal-dark"
        >
          Try again
        </button>
        <Link
          to={cachedHref}
          className="inline-flex h-11 items-center justify-center rounded-full border border-eve-teal/30 bg-white px-5 text-sm font-medium text-eve-teal transition-colors hover:bg-eve-teal-light"
        >
          Go to cached content
        </Link>
      </div>
    </div>
  );
}
