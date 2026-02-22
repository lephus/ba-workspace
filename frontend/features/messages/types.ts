// Message types

export interface MessageAttachment {
  type: "document" | "file";
  id?: number;
  filename: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
  agent_id?: string | null;
  bot?: Bot;
  attachments?: MessageAttachment[];
}

export interface Bot {
  name: string;
  avatar: string;
  role: string;
}

export interface SendMessageResponse {
  message: Message;
  assistant_message?: Message & { bot?: Bot };
  bot?: Bot;
  agents_involved?: string[];
  export_requested?: {
    format: string;
    download_url: string;
    filename: string;
  };
}

export interface StructuredContent {
  content_type: "text";
  parts: string[];
}

export interface SendMessageInput {
  role: "user";
  content: StructuredContent;
  attachments?: MessageAttachment[];
}

export interface PinnedMessage {
  id: number;
  message_id: number;
  message_preview: string;
  pinned_at: string;
}
