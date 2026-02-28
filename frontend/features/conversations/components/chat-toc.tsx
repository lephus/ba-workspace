"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { Message } from "@/features/messages/types";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface TocEntry {
  id: number;
  preview: string;
  depth: number;
}

interface ChatTocProps {
  messages?: Message[]; // Changed to optional with default
  headings?: any[]; // Added headings, type unknown from diff
  className?: string;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function truncate(text: string, maxLen: number): string {
  const single = text.replace(/\s+/g, " ").trim();
  return single.length > maxLen ? single.slice(0, maxLen) + "…" : single;
}

const BAR_WIDTH: Record<number, string> = {
  0: "w-4",
  1: "w-3",
};

const BAR_INDENT: Record<number, string> = {
  0: "ml-0",
  1: "ml-1",
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

// Placeholder for useHeadings as it's not provided in the diff
const useHeadings = () => ({
  registerHeading: () => { },
  unregisterHeading: () => { },
});

export function ChatToc({ messages = [], headings = [], className }: ChatTocProps) {
  const { registerHeading, unregisterHeading } = useHeadings();
  const tc = useTranslations('common');

  const [hovered, setHovered] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const tocRef = useRef<HTMLDivElement>(null);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visibleSetRef = useRef<Set<number>>(new Set());

  // Build TOC entries from user messages only
  const entries: TocEntry[] = messages
    .filter((m) => m.role === "user")
    .map((m) => ({
      id: m.id,
      preview: truncate(m.content, 60),
      depth: 0,
    }));

  // Stable hover handlers with small delay to prevent child-element flickering
  const handleMouseEnter = useCallback(() => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    setHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    leaveTimerRef.current = setTimeout(() => {
      setHovered(false);
    }, 80);
  }, []);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    };
  }, []);

  // Track which message is currently in viewport (topmost wins)
  useEffect(() => {
    observerRef.current?.disconnect();
    visibleSetRef.current.clear();

    const userMessageIds = entries.map((e) => e.id);
    const elements = userMessageIds
      .map((id) => document.getElementById(`message-${id}`))
      .filter(Boolean) as HTMLElement[];

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (intersections) => {
        for (const entry of intersections) {
          const id = Number(entry.target.id.replace("message-", ""));
          if (entry.isIntersecting) {
            visibleSetRef.current.add(id);
          } else {
            visibleSetRef.current.delete(id);
          }
        }
        // Always pick the topmost visible message (preserves order)
        const topmost = userMessageIds.find((id) =>
          visibleSetRef.current.has(id),
        );
        if (topmost !== undefined) {
          setActiveId(topmost);
        }
      },
      { threshold: 0.2 },
    );

    elements.forEach((el) => observer.observe(el));
    observerRef.current = observer;

    return () => {
      observer.disconnect();
      visibleSetRef.current.clear();
    };
  }, [entries.map((e) => e.id).join(",")]);

  const scrollToMessage = useCallback((messageId: number) => {
    const el = document.getElementById(`message-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("bg-primary/5");
      setTimeout(() => el.classList.remove("bg-primary/5"), 1500);
    }
  }, []);

  if (entries.length < 2) return null;

  return (
    <div
      ref={tocRef}
      className={cn(
        "fixed right-4 top-1/2 -translate-y-1/2 z-30",
        "transition-[width] duration-300 ease-in-out",
        hovered ? "w-56" : "w-7",
        className,
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={cn(
          "relative rounded-lg transition-[background-color,border-color,box-shadow] duration-300",
          // Cap height to viewport so popup never overflows top/bottom
          hovered
            ? "bg-popover border shadow-lg flex flex-col max-h-[calc(100vh-4rem)]"
            : "bg-transparent border-transparent shadow-none",
        )}
      >
        {/* ── Collapsed view: minimap bars ── */}
        <div
          aria-hidden={hovered}
          className={cn(
            "flex flex-col gap-2.5 pl-1.5 py-3",
            "transition-opacity duration-200 ease-in-out",
            // absolute when hovered so it doesn't affect container height
            hovered
              ? "opacity-0 pointer-events-none absolute inset-0"
              : "opacity-100 relative",
          )}
        >
          {entries.map((entry) => (
            <div key={entry.id} className={BAR_INDENT[entry.depth]}>
              <div
                className={cn(
                  "h-0.5 rounded-full transition-colors duration-200",
                  BAR_WIDTH[entry.depth],
                  activeId === entry.id
                    ? "bg-foreground shadow-[0_0_3px_var(--foreground)]"
                    : "bg-muted-foreground/30",
                )}
              />
            </div>
          ))}
        </div>

        {/* ── Expanded view: scrollable list ── */}
        {/*
          We render this as absolute while collapsed so it doesn't affect
          the container's height, and transition only opacity + translate.
          pointer-events-none prevents invisible items from being clicked.
        */}
        <div
          aria-hidden={!hovered}
          className={cn(
            "flex flex-col",
            "transition-[opacity,transform] duration-300 ease-in-out",
            hovered
              ? "opacity-100 translate-x-0 pointer-events-auto relative"
              : "opacity-0 -translate-x-1 pointer-events-none absolute inset-0",
          )}
        >
          <div className="px-3 pt-2.5 pb-1.5 shrink-0">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              {tc('question')}
            </span>
          </div>
          {/*
            Native scroll: Radix ScrollArea Viewport uses height:100% internally,
            which requires an explicit pixel height on the Root — incompatible with
            flex-1 / max-height. A plain div with overflow-y-auto is reliable.
          */}
          <div
            className={cn(
              "overflow-y-auto overscroll-contain",
              // cap at viewport minus: 4rem outer margin + ~2.5rem header
              "max-h-[calc(100vh-16rem)]",
              // thin custom scrollbar
              "[&::-webkit-scrollbar]:w-1",
              "[&::-webkit-scrollbar-track]:bg-transparent",
              "[&::-webkit-scrollbar-thumb]:rounded-full",
              "[&::-webkit-scrollbar-thumb]:bg-border",
              "[&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground/40",
            )}
          >
            <div className="flex flex-col gap-0.5 px-1.5 pb-2">
              {entries.map((entry, idx) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => scrollToMessage(entry.id)}
                  className={cn(
                    "flex items-start gap-2 text-left rounded-md px-2 py-1.5 text-xs",
                    "transition-colors duration-150 cursor-pointer",
                    "hover:bg-muted",
                    activeId === entry.id
                      ? "text-foreground font-medium bg-muted/60"
                      : "text-muted-foreground",
                  )}
                >
                  <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground/60 mt-px w-4 text-right">
                    {idx + 1}
                  </span>
                  <span className="line-clamp-2 leading-snug min-w-0">
                    {entry.preview}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
