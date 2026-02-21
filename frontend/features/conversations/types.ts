// Conversation types

export interface Conversation {
  id: number;
  project_id: number;
  title: string;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}
