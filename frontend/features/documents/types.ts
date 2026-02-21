// Document types

export interface Document {
  id: number;
  project_id: number;
  filename: string;
  file_type: string;
  file_size: number;
  ai_task?: string | null;
  notes?: string | null;
  conversation_id?: number | null;
  created_at: string;
  updated_at: string;
}

export interface UploadDocumentInput {
  file: File;
  conversation_id?: number;
  ai_task?: string;
  notes?: string;
}
