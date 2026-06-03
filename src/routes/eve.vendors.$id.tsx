import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Minus, Plus, ShoppingCart, X } from "lucide-react";
import { TrustBadge } from "@/components/ui/TrustBadge";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Skeleton } from "@/components/ui/skeleton";
import { ContentCard } from "@/components/ui/ContentCard";
import { SectionLabel } from "@/components/ui/SectionLabel";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import type { ContentRow } from "@/lib/content-filter";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/eve/vendors/$id")({
  component: EveVendorDetail,
});

type Vendor = {
  id: string;
  business_name: string | null;
  category: string | null;
  city: string | null;
  logo_url: string | null;
  description: string | null;
};

type Product = {
  id: string;
  vendor_id: string;
  name: string;
  description: string | null;
  price_mad: number | null;
  image_url: string | null;
  pregnancy_week_min: number | null;
  pregnancy_week_max: number | null;
};

type CartItem = { product: Product; qty: number };

function initials(name: string | null) {
  if (!name) return "??";
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function EveVendorDetail() {
  const { id } = Route.useParams();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [week, setWeek] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [openProduct, setOpenProduct] = useState<Product | null>(null);
  const [openQty, setOpenQty] = useState(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [partnerContent, setPartnerContent] = useState<ContentRow[]>([]);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (userId) {
        const { data: m } = await supabase
          .from("mothers")
          .select("pregnancy_week")
          .eq("user_id", userId)
          .maybeSingle();
        if (m?.pregnancy_week) setWeek(m.pregnancy_week);
      }

      const [{ data: v }, { data: p }, { data: c }] = await Promise.all([
        supabase.from("vendors").select("*").eq("id", id).maybeSingle(),
        supabase
          .from("products")
          .select("*")
          .eq("vendor_id", id)
          .eq("is_available", true),
        supabase
          .from("vendor_content")
          .select("*")
          .eq("vendor_id", id)
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(6),
      ]);
      setVendor(v as Vendor | null);
      setProducts((p ?? []) as Product[]);
      setPartnerContent((c ?? []) as ContentRow[]);
      setLoading(false);
    })();
  }, [id]);

  const visibleProducts = useMemo(() => {
    if (!week || showAll) return products;
    return products.filter((p) => {
      const lo = p.pregnancy_week_min ?? 0;
      const hi = p.pregnancy_week_max ?? 42;
      return week >= lo && week <= hi;
    });
  }, [products, week, showAll]);

  const stageFiltered = week && !showAll && visibleProducts.length !== products.length;

  function addToCart(p: Product, qty: number) {
    setCart((c) => {
      const i = c.findIndex((x) => x.product.id === p.id);
      if (i >= 0) {
        const next = [...c];
        next[i] = { ...next[i], qty: next[i].qty + qty };
        return next;
      }
      return [...c, { product: p, qty }];
    });
    setOpenProduct(null);
    setOpenQty(1);
  }

  const total = cart.reduce((s, i) => s + (i.product.price_mad ?? 0) * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  function checkout() {
    if (!vendor) return;
    const lines = cart
      .map((i) => `• ${i.qty}× ${i.product.name} (${(i.product.price_mad ?? 0) * i.qty} MAD)`)
      .join("\n");
    const msg = encodeURIComponent(
      `Hello ${vendor.business_name}, I would like to order via Eve:\n\n${lines}\n\nTotal: ${total} MAD`,
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  }

  return (
    <ProtectedRoute requiredType="mother">
      <div className="min-h-screen bg-eve-sand pb-28">
        <div className="mx-auto max-w-sm">
          {/* Header */}
          <header className="flex items-center gap-3 px-5 pt-6">
            <Link
              to="/eve/vendors"
              aria-label="Back"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-eve-cream text-eve-teal-dark"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <span className="font-sans text-sm text-eve-muted">Vendor</span>
          </header>

          <main className="px-5 pt-4">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-24 rounded-2xl bg-eve-muted/20" />
                <Skeleton className="h-40 rounded-2xl bg-eve-muted/20" />
              </div>
            ) : !vendor ? (
              <p className="font-sans text-sm text-eve-muted">Vendor not found.</p>
            ) : (
              <>
                {/* Vendor header */}
                <section className="flex items-start gap-3">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-eve-terra-light font-serif text-xl text-eve-terra">
                    {initials(vendor.business_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="font-serif text-xl text-eve-forest">
                      {vendor.business_name}
                    </h1>
                    <div className="mt-1 flex items-center gap-2">
                      <TrustBadge />
                      {vendor.city && (
                        <span className="font-sans text-[11px] text-eve-muted">· {vendor.city}</span>
                      )}
                    </div>
                    <p className="mt-1 font-sans text-[11px] text-eve-muted">
                      Delivery via vendor · WhatsApp orders
                    </p>
                  </div>
                </section>
                {vendor.description && (
                  <p className="mt-3 font-sans text-sm text-eve-forest/80">
                    {vendor.description}
                  </p>
                )}

                {/* Stage banner */}
                {stageFiltered && week && (
                  <div className="mt-4 flex items-center justify-between rounded-2xl bg-eve-teal-light px-3 py-2">
                    <p className="font-sans text-[12px] text-eve-teal-dark">
                      Showing products for week {week}.
                    </p>
                    <button
                      onClick={() => setShowAll(true)}
                      className="font-sans text-[11px] font-medium text-eve-teal underline"
                    >
                      Show all
                    </button>
                  </div>
                )}

                {/* Grid */}
                <section className="mt-4 grid grid-cols-2 gap-3">
                  {visibleProducts.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setOpenProduct(p);
                        setOpenQty(1);
                      }}
                      className="flex flex-col gap-2 rounded-2xl bg-eve-cream p-2 text-left"
                    >
                      <div className="aspect-square w-full overflow-hidden rounded-xl bg-eve-sand">
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt={p.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center font-serif text-2xl text-eve-muted/40">
                            ◌
                          </div>
                        )}
                      </div>
                      <div className="px-1">
                        <div className="line-clamp-2 font-sans text-[12px] text-eve-forest">
                          {p.name}
                        </div>
                        <div className="mt-0.5 font-sans text-sm font-medium text-eve-teal">
                          {p.price_mad ?? 0} MAD
                        </div>
                        {(p.pregnancy_week_min || p.pregnancy_week_max) && (
                          <span className="mt-1 inline-block rounded-full bg-eve-terra-light px-2 py-0.5 font-sans text-[9px] text-eve-terra">
                            wk {p.pregnancy_week_min ?? 0}–{p.pregnancy_week_max ?? 42}
                          </span>
                        )}
                      </div>
                      <div
                        role="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(p, 1);
                        }}
                        className="mx-1 mt-1 inline-flex items-center justify-center gap-1 rounded-full bg-eve-teal px-3 py-1 font-sans text-[11px] font-medium text-white"
                      >
                        <Plus className="h-3 w-3" /> Add
                      </div>
                    </button>
                  ))}
                </section>
                {visibleProducts.length === 0 && (
                  <p className="mt-6 text-center font-sans text-sm text-eve-muted">
                    No products to show.
                  </p>
                )}
              </>
            )}
          </main>
        </div>

        {/* Floating cart */}
        {cartCount > 0 && (
          <button
            onClick={() => setCartOpen(true)}
            className="fixed bottom-6 left-1/2 z-40 flex w-[calc(100%-2.5rem)] max-w-sm -translate-x-1/2 items-center justify-between rounded-full bg-eve-teal px-5 py-3 text-white shadow-lg"
          >
            <span className="flex items-center gap-2 font-sans text-sm">
              <ShoppingCart className="h-4 w-4" />
              {cartCount} item{cartCount === 1 ? "" : "s"}
            </span>
            <span className="font-sans text-sm font-medium">{total} MAD</span>
          </button>
        )}

        {/* Product sheet */}
        <Sheet
          open={!!openProduct}
          onOpenChange={(o) => {
            if (!o) {
              setOpenProduct(null);
              setOpenQty(1);
            }
          }}
        >
          <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-3xl bg-eve-sand">
            {openProduct && (
              <div className="mx-auto max-w-sm">
                <div className="aspect-square w-full overflow-hidden rounded-2xl bg-eve-cream">
                  {openProduct.image_url ? (
                    <img
                      src={openProduct.image_url}
                      alt={openProduct.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-serif text-4xl text-eve-muted/40">
                      ◌
                    </div>
                  )}
                </div>
                <SheetHeader className="mt-4">
                  <SheetTitle className="font-serif text-lg text-eve-forest">
                    {openProduct.name}
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-1 font-sans text-base font-medium text-eve-teal">
                  {openProduct.price_mad ?? 0} MAD
                </div>
                {openProduct.description && (
                  <p className="mt-3 font-sans text-sm text-eve-forest/80">
                    {openProduct.description}
                  </p>
                )}
                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={() => setOpenQty((q) => Math.max(1, q - 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-eve-cream text-eve-teal-dark"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="font-sans text-base font-medium text-eve-forest">{openQty}</span>
                  <button
                    onClick={() => setOpenQty((q) => q + 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-eve-cream text-eve-teal-dark"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <PrimaryButton
                  className="mt-5 w-full"
                  onClick={() => addToCart(openProduct, openQty)}
                >
                  Add to cart
                </PrimaryButton>
                <div className="mt-3 flex justify-center">
                  <TrustBadge />
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* Cart sheet */}
        <Sheet open={cartOpen} onOpenChange={setCartOpen}>
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-3xl bg-eve-sand">
            <div className="mx-auto max-w-sm">
              <SheetHeader>
                <SheetTitle className="font-serif text-lg text-eve-forest">Your cart</SheetTitle>
              </SheetHeader>
              <ul className="mt-4 divide-y divide-eve-muted/20">
                {cart.map((i) => (
                  <li key={i.product.id} className="flex items-center justify-between py-3">
                    <div className="min-w-0">
                      <div className="truncate font-sans text-sm text-eve-forest">
                        {i.qty}× {i.product.name}
                      </div>
                      <div className="font-sans text-[11px] text-eve-muted">
                        {(i.product.price_mad ?? 0) * i.qty} MAD
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        setCart((c) => c.filter((x) => x.product.id !== i.product.id))
                      }
                      aria-label="Remove"
                      className="text-eve-muted"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex items-center justify-between border-t border-eve-muted/20 pt-3">
                <span className="font-sans text-sm text-eve-muted">Total</span>
                <span className="font-sans text-base font-medium text-eve-forest">{total} MAD</span>
              </div>
              <p className="mt-3 font-sans text-[11px] italic text-eve-muted">
                Complete your order via WhatsApp with {vendor?.business_name}. Full payment
                processing is coming soon.
              </p>
              <PrimaryButton className={cn("mt-4 w-full bg-[#25D366] hover:bg-[#1ebd5b]")} onClick={checkout}>
                Proceed to checkout
              </PrimaryButton>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </ProtectedRoute>
  );
}
