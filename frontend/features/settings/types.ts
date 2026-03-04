export interface ApiKey {
  id: number | null;
  key_masked: string;
  label: string | null;
  is_active: boolean;
  last_error: string | null;
  last_used_at: string | null;
  created_at: string | null;
  source: "env" | "ui";
  is_current: boolean;
}

export interface AddApiKeyInput {
  key: string;
  label?: string;
  validate?: boolean;
}

export interface ValidateApiKeyResult {
  valid: boolean;
  error: string | null;
}
