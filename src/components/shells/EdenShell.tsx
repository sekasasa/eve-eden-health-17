import { ReactNode, useState } from "react";
import { Menu, X } from "lucide-react";
import { EdenSidebar } from "./EdenSidebar";
import { ProtectedRoute } from "@/components/ProtectedRoute";

interface Props {
  children: ReactNode;
  variant?: "provider" | "vendor";
}

export function EdenShell({ children, variant = "provider" }: Props) {
  const [open, setOpen] = useState(false);
  const requiredType = variant === "vendor" ? "vendor" : "provider";

  return (
    <ProtectedRoute requiredType={requiredType}>
      <div className="flex min-h-screen w-full bg-white">
        <EdenSidebar variant={variant} />

        {/* Mobile overlay sidebar */}
        {open && (
          <div className="fixed inset-0 z-40 md:hidden" onClick={() => setOpen(false)}>
            <div className="absolute inset-0 bg-black/40" />
            <div
              className="absolute inset-y-0 left-0 w-64"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-full bg-eve-teal-dark text-white">
                <EdenSidebar variant={variant} />
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-1 flex-col bg-gray-50">
          <header className="flex items-center border-b border-gray-200 bg-white px-4 py-3 md:hidden">
            <button
              aria-label="Open menu"
              onClick={() => setOpen(!open)}
              className="text-eve-teal-dark"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <span className="ml-3 font-serif text-xl text-eve-teal">eden.</span>
          </header>
          <main className="flex-1 p-6 md:p-8">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
