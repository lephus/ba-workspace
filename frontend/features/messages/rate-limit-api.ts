import { APP_CONFIG } from "@/config/app";

export interface RateLimitError {
  type: string;
  message: string;
  seconds_ago: number;
}

export interface RateLimitStatus {
  // RPM (Requests per Minute)
  used: number;
  remaining: number;
  rpm_limit: number;
  // RPD (Requests per Day) — resets at midnight Pacific Time
  rpd_used: number;
  rpd_remaining: number;
  rpd_limit: number;
  // TPM (Tokens per Minute) — informational
  tpm_limit: number;
  // Rate-limit state
  is_limited: boolean;
  limited_seconds_ago: number | null;
  reset_seconds: number;
  // Tier & model
  tier: "Free" | "Tier 1" | "Tier 2" | "Tier 3";
  model: string;
  // Key & errors
  key_valid: boolean | null;
  key_error: string | null;
  last_error: RateLimitError | null;
  // Currently active key info
  current_key: {
    key_masked: string;
    source: "env" | "ui";
    id: number | null;
    label: string | null;
  } | null;
}

const API_URL = APP_CONFIG.API_URL;

export async function getRateLimitApi(): Promise<RateLimitStatus> {
  const response = await fetch(`${API_URL}/rate-limit`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    throw new Error("Không thể lấy thông tin rate limit");
  }
  return response.json();
}
