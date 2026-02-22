import { APP_CONFIG } from "@/config/app";
import type { Document, UploadDocumentInput } from "./types";

const API_URL = APP_CONFIG.API_URL;

// GET /projects/:projectId/documents
export async function getDocumentsApi(
  projectId: number
): Promise<Document[]> {
  const response = await fetch(
    `${API_URL}/projects/${projectId}/documents`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Không tìm thấy dự án");
    }
    throw new Error("Không thể tải danh sách tài liệu");
  }

  return response.json();
}

// POST /projects/:projectId/documents
export async function uploadDocumentApi(
  projectId: number,
  data: UploadDocumentInput
): Promise<Document> {
  const formData = new FormData();
  formData.append("file", data.file);

  if (data.conversation_id) {
    formData.append("conversation_id", String(data.conversation_id));
  }
  if (data.ai_task) {
    formData.append("ai_task", data.ai_task);
  }
  if (data.notes) {
    formData.append("notes", data.notes);
  }

  const response = await fetch(
    `${API_URL}/projects/${projectId}/documents`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    if (response.status === 400) {
        const body = await response.json().catch(() => ({}));
        throw new Error(
          body.error ?? "Tệp không hợp lệ hoặc định dạng không được hỗ trợ (pdf, docx, doc, txt, xlsx, xls)"
        );
      }
    if (response.status === 404) {
      throw new Error("Không tìm thấy dự án");
    }
    throw new Error("Không thể tải lên tài liệu");
  }

  return response.json();
}

// DELETE /projects/:projectId/documents/:documentId
export async function deleteDocumentApi(
  projectId: number,
  documentId: number
): Promise<void> {
  const response = await fetch(
    `${API_URL}/projects/${projectId}/documents/${documentId}`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Không tìm thấy tài liệu");
    }
    throw new Error("Không thể xóa tài liệu");
  }
}
