import { Link } from "@tanstack/react-router";
import { BookOpen, Play, Lightbulb, Calendar, Tag, Bookmark } from "lucide-react";
import { TrustBadge } from "@/components/ui/TrustBadge";
import { estimateReadTime, type ContentRow } from "@/lib/content-filter";
import { cn } from "@/lib/utils";

const TYPE_ICON: Record<string, typeof BookOpen> = {
  article: BookOpen,
  video: Play,
  tip: Lightbulb,
  event: Calendar,
  promotion: Tag,
};

const TYPE_LABEL: Record<string, string> = {
  article: "Article",
  video: "Video",
  tip: "Quick tip",
  event: "Event",
  promotion: "Promotion",
};

const CTA_LABEL: Record<string, string> = {
  book: "Book",
  quote: "Request quote",
  profile: "View profile",
  message: "Message",
  save: "Save",
  register: "Register",
  shop: "Shop now",
  navigator: "Ask a navigator",
};

export function ContentCard({
  content,
  vendorName,
  onSave,
  saved,
  className,
}: {
  content: ContentRow;
  vendorName?: string;
  onSave?: () => void;
  saved?: boolean;
  className?: string;
}) {
  const Icon = TYPE_ICON[content.content_type] ?? BookOpen;
  const time = estimateReadTime(content.body, content.content_type);
  return (
    <article
      className={cn(
        "flex flex-col gap-2 rounded-2xl bg-eve-cream p-3",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-eve-teal-light px-2 py-0.5 text-[10px] font-medium text-eve-teal">
          <Icon className="h-3 w-3" /> {TYPE_LABEL[content.content_type] ?? content.content_type}
        </span>
        {content.category && (
          <span className="rounded-full bg-eve-terra-light px-2 py-0.5 text-[10px] text-eve-terra">
            {content.category}
          </span>
        )}
        {onSave && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onSave();
            }}
            aria-label="Save"
            className={cn("ml-auto text-eve-muted", saved && "text-eve-teal")}
          >
            <Bookmark className={cn("h-4 w-4", saved && "fill-current")} />
          </button>
        )}
      </div>

      <Link
        to="/eve/content/$id"
        params={{ id: content.id }}
        className="block"
      >
        <h3 className="font-serif text-[15px] leading-snug text-eve-forest line-clamp-2">
          {content.title}
        </h3>
        {content.excerpt && (
          <p className="mt-1 line-clamp-2 text-[12px] text-eve-muted">
            {content.excerpt}
          </p>
        )}
      </Link>

      <div className="mt-1 flex items-center gap-2 text-[10px] text-eve-muted">
        {vendorName && (
          <span className="truncate font-medium text-eve-teal-dark">{vendorName}</span>
        )}
        <TrustBadge />
        <span>· {time}</span>
        {content.language && <span>· {content.language}</span>}
      </div>

      {content.cta_type && (
        <Link
          to="/eve/content/$id"
          params={{ id: content.id }}
          className="mt-2 inline-flex w-fit items-center justify-center rounded-full bg-eve-teal px-3 py-1 text-[11px] font-medium text-white"
        >
          {CTA_LABEL[content.cta_type] ?? "Open"}
        </Link>
      )}
    </article>
  );
}
