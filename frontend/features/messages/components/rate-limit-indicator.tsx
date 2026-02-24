"use client";

import { useRateLimit } from "@/features/messages/hooks";
import {
  AlertTriangle,
  ExternalLink,
  Gauge,
  KeyRound,
  Zap,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

const TIER_COLORS: Record<string, string> = {
  Free: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  "Tier 1": "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "Tier 2":
    "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  "Tier 3":
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

/* ------------------------------------------------------------------ */
/* ProgressBar                                                         */
/* ------------------------------------------------------------------ */

function ProgressBar({
  label,
  used,
  limit,
  unit,
}: {
  label: string;
  used: number;
  limit: number;
  unit: string;
}) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const color =
    pct >= 80 ? "bg-red-500" : pct >= 50 ? "bg-yellow-500" : "bg-emerald-500";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground font-medium">{label}</span>
        <span className="tabular-nums">
          {formatNumber(used)}/{formatNumber(limit)}{" "}
          <span className="text-muted-foreground">{unit}</span>
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Compact trigger icon                                                */
/* ------------------------------------------------------------------ */

function StatusIcon({
  keyInvalid,
  hasQuotaError,
  isLimited,
  rpmPct,
}: {
  keyInvalid: boolean;
  hasQuotaError: boolean;
  isLimited: boolean;
  rpmPct: number;
}) {
  const size = 28;
  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  // Error / warning states — show a ring with alert icon
  if (keyInvalid) {
    return (
      <div className="relative inline-flex items-center justify-center size-7">
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-red-200 dark:text-red-900/50"
          />
        </svg>
        <KeyRound className="absolute size-3.5 text-red-500" />
      </div>
    );
  }
  if (hasQuotaError) {
    return (
      <div className="relative inline-flex items-center justify-center size-7">
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-orange-200 dark:text-orange-900/50"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={circumference}
            strokeLinecap="round"
            className="text-orange-500"
          />
        </svg>
        <AlertTriangle className="absolute size-3.5 text-orange-500" />
      </div>
    );
  }
  if (isLimited) {
    return (
      <div className="relative inline-flex items-center justify-center size-7">
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-red-200 dark:text-red-900/50"
            strokeDasharray="3 3"
          />
        </svg>
        <Zap className="absolute size-3.5 text-red-500" />
      </div>
    );
  }

  // Normal — circular progress ring
  const clampedPct = Math.min(100, Math.max(0, rpmPct));
  const offset = circumference - (clampedPct / 100) * circumference;
  const ringColor =
    clampedPct >= 80
      ? "text-red-500"
      : clampedPct >= 50
        ? "text-yellow-500"
        : "text-emerald-500";
  const trackColor =
    clampedPct >= 80
      ? "text-red-100 dark:text-red-900/30"
      : clampedPct >= 50
        ? "text-yellow-100 dark:text-yellow-900/30"
        : "text-emerald-100 dark:text-emerald-900/30";

  return (
    <div className="relative inline-flex items-center justify-center size-7">
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className={trackColor}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${ringColor} transition-all duration-500`}
        />
      </svg>
      <span
        className={`absolute text-[9px] font-bold tabular-nums ${ringColor}`}
      >
        {clampedPct}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

export function RateLimitIndicator() {
  const { data: status } = useRateLimit();

  if (!status) return null;

  const keyInvalid = status.key_valid === false;
  const hasQuotaError =
    status.last_error?.type === "quota" ||
    (status.key_error != null && status.key_valid === true);
  const isLimited = status.is_limited;
  const rpmPct =
    status.rpm_limit > 0
      ? Math.round((status.used / status.rpm_limit) * 100)
      : 0;

  const tierClass = TIER_COLORS[status.tier] ?? TIER_COLORS["Free"];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center size-8 cursor-pointer rounded-full hover:bg-muted transition-colors"
        >
          <StatusIcon
            keyInvalid={keyInvalid}
            hasQuotaError={hasQuotaError}
            isLimited={isLimited}
            rpmPct={rpmPct}
          />
        </button>
      </PopoverTrigger>

      <PopoverContent side="bottom" align="end" className="w-80 p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <div className="flex items-center gap-2">
            <Gauge className="size-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Rate Limits</span>
          </div>
          <div
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${tierClass}`}
          >
            {status.tier}
          </div>
        </div>

        {/* Model */}
        <div className="px-4 pb-2">
          <span className="text-[11px] text-muted-foreground">
            Model:{" "}
            <span className="font-medium text-foreground">{status.model}</span>
          </span>
        </div>

        <Separator />

        {/* Error / warning banner */}
        {keyInvalid && (
          <div className="mx-4 mt-3 rounded-md bg-red-50 dark:bg-red-950/30 px-3 py-2 text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
            <KeyRound className="size-3.5 mt-0.5 shrink-0" />
            <span>
              {status.key_error || "API key không hợp lệ hoặc đã hết hạn"}
            </span>
          </div>
        )}
        {!keyInvalid && hasQuotaError && (
          <div className="mx-4 mt-3 rounded-md bg-orange-50 dark:bg-orange-950/30 px-3 py-2 text-xs text-orange-600 dark:text-orange-400 flex items-start gap-2">
            <AlertTriangle className="size-3.5 mt-0.5 shrink-0" />
            <span>
              {status.last_error?.message ||
                status.key_error ||
                "Đã hết quota miễn phí hôm nay"}
            </span>
          </div>
        )}
        {!keyInvalid && !hasQuotaError && isLimited && (
          <div className="mx-4 mt-3 rounded-md bg-red-50 dark:bg-red-950/30 px-3 py-2 text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
            <Zap className="size-3.5 mt-0.5 shrink-0" />
            <span>
              Đang bị giới hạn tốc độ. Đợi {Math.ceil(status.reset_seconds)}s.
            </span>
          </div>
        )}

        {/* Metrics */}
        <div className="px-4 py-3 space-y-3">
          <ProgressBar
            label="RPM — Requests / phút"
            used={status.used}
            limit={status.rpm_limit}
            unit="req"
          />
          <ProgressBar
            label="RPD — Requests / ngày"
            used={status.rpd_used}
            limit={status.rpd_limit}
            unit="req"
          />
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground font-medium">
              TPM — Tokens / phút
            </span>
            <span className="tabular-nums text-muted-foreground">
              Giới hạn: {formatNumber(status.tpm_limit)}
            </span>
          </div>
        </div>

        <Separator />

        {/* Tier info */}
        <div className="px-4 py-3 space-y-2">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Rate limits được áp dụng theo{" "}
            <span className="font-medium text-foreground">project</span>, không
            phải theo API key. RPD reset lúc 00:00 Pacific Time.
          </p>

          {/* Tier breakdown */}
          <div className="grid grid-cols-4 gap-1 text-[10px]">
            {["Free", "Tier 1", "Tier 2", "Tier 3"].map((t) => (
              <div
                key={t}
                className={`flex flex-col items-center rounded-md py-1.5 ${
                  status.tier === t
                    ? "bg-primary/10 ring-1 ring-primary/30 font-semibold"
                    : "bg-muted/50 text-muted-foreground"
                }`}
              >
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Footer link */}
        <div className="px-4 py-2.5">
          <a
            href="https://aistudio.google.com/rate-limit?timeRange=last-28-days"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[11px] text-primary hover:underline"
          >
            <ExternalLink className="size-3" />
            Xem rate limits trên AI Studio
          </a>
        </div>
      </PopoverContent>
    </Popover>
  );
}
