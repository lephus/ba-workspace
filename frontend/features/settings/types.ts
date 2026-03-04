// API Key types

export interface ApiKey {
  id: number | null;
  key_masked: string;
  label: string | null;
  is_active: boolean;
  source: "env" | "ui";
  last_error: string | null;
  last_used_at: string | null;
  created_at: string | null;
}

export interface AddApiKeyInput {
  key: string;
  label?: string;
  validate?: boolean;
}

export interface ValidateKeyResult {
  valid: boolean;
  error: string | null;
}
