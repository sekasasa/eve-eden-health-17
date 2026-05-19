import { ReactNode, useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  /** Async handler. If omitted, falls back to window.location.reload(). */
  onRefresh?: () => Promise<void> | void;
}

const THRESHOLD = 70;

export function PullToRefresh({ children, onRefresh }: Props) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY > 0) return;
      startY.current = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (startY.current === null) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy > 0 && window.scrollY === 0) {
        setPull(Math.min(dy * 0.5, 100));
      }
    };
    const onTouchEnd = async () => {
      if (startY.current === null) return;
      startY.current = null;
      if (pull >= THRESHOLD && !refreshing) {
        setRefreshing(true);
        try {
          if (onRefresh) await onRefresh();
          else window.location.reload();
        } finally {
          setRefreshing(false);
          setPull(0);
        }
      } else {
        setPull(0);
      }
    };
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [pull, refreshing, onRefresh]);

  return (
    <>
      {(pull > 0 || refreshing) && (
        <div
          className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center"
          style={{ transform: `translateY(${Math.min(pull, 60)}px)` }}
        >
          <div className="mt-2 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow">
            <RefreshCw
              className={`h-4 w-4 text-eve-teal ${refreshing ? "animate-spin" : ""}`}
              style={{ transform: `rotate(${pull * 4}deg)` }}
            />
          </div>
        </div>
      )}
      {children}
    </>
  );
}
