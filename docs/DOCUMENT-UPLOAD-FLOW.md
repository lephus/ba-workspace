# Tài liệu: Luồng Xử Lý Tài Liệu (Document Upload & RAG Pipeline)

> Mô tả toàn bộ code đã triển khai cho tính năng upload tài liệu kèm AI processing.  
> Cập nhật: 02/2026

---

## Mục lục

1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Giới hạn & Quy tắc](#2-giới-hạn--quy-tắc)
3. [Sơ đồ luồng dữ liệu](#3-sơ-đồ-luồng-dữ-liệu)
4. [Frontend](#4-frontend)
5. [Backend — Upload & Validation](#5-backend--upload--validation)
6. [RAG Pipeline](#6-rag-pipeline)
7. [Gửi tin nhắn kèm tài liệu](#7-gửi-tin-nhắn-kèm-tài-liệu)
8. [Database Schema](#8-database-schema)
9. [Danh sách file liên quan](#9-danh-sách-file-liên-quan)
10. [Điểm cần lưu ý / Biết trước khi sửa](#10-điểm-cần-lưu-ý--biết-trước-khi-sửa)

---

## 1. Tổng quan hệ thống

Người dùng có thể đính kèm tài liệu vào cuộc trò chuyện theo 2 cách:

| Cách                       | Mô tả                                                                |
| -------------------------- | -------------------------------------------------------------------- |
| **Upload tài liệu mới**    | Qua form dialog (trang Documents) hoặc qua dropdown trong chat input |
| **Gắn tài liệu đã upload** | Chọn từ danh sách tài liệu đã có trong dropdown của chat input       |

Khi tài liệu được **upload**, hệ thống sẽ:

1. Validate format + kích thước + số trang
2. Lưu file vào `data/documents/{project_id}/`
3. **Chạy RAG pipeline** — Gemini đọc nội dung, tạo summary/keywords/important_points, chỉ định agent phù hợp
4. Lưu kết quả RAG vào DB

Khi người dùng **gửi message kèm tài liệu**, hệ thống sẽ:

1. Load RAG context của tài liệu từ DB
2. Inject context vào prompt của agent
3. Agent trả lời dựa trên cả nội dung chat lẫn tài liệu

---

## 2. Giới hạn & Quy tắc

| Quy tắc                    | Giá trị                                          |
| -------------------------- | ------------------------------------------------ |
| Định dạng chấp nhận        | `.pdf`, `.docx`, `.doc`, `.txt`, `.xlsx`, `.xls` |
| Kích thước tối đa          | **100 MB**                                         |
| Số trang tối đa            | **300 trang**                                     |
| Cách tính trang — PDF      | Đếm thực tế (`len(reader.pages)`)                |
| Cách tính trang — DOCX/DOC | Ước lượng: `ceil(word_count / 300)`              |
| Cách tính trang — TXT      | Ước lượng: `ceil(char_count / 1800)`             |
| Cách tính trang — Excel    | Số sheets (`len(wb.worksheets)`)                 |
| Nội dung tối đa gửi Gemini | 12.000 ký tự đầu tiên của file                   |
| Keywords tối đa            | 10                                               |
| Important points tối đa    | 5                                                |

---

## 3. Sơ đồ luồng dữ liệu

```
┌─────────────────────────────────────────────────────────────────────┐
│                          UPLOAD FLOW                                 │
└─────────────────────────────────────────────────────────────────────┘

Frontend (chat-input / upload-dialog)
  │
  ├─ [1] Validate ngay tại trình duyệt:
  │       • Định dạng (ext not in accepted set) → toast lỗi, bỏ file
  │       • Kích thước > 5MB → toast lỗi, bỏ file
  │
  └─ [2] POST /api/v1/projects/:id/documents  (FormData)
              │
              ├─ [3] Backend validate:
              │       • Định dạng không trong ALLOWED_EXTENSIONS → 400
              │       • Kích thước > MAX_FILE_SIZE_BYTES → 400
              │       • parse_document() → page_count > MAX_PAGE_COUNT → 400
              │
              ├─ [4] Lưu file vào data/documents/{project_id}/{uuid}.ext
              │
              ├─ [5] Tạo Document record trong DB
              │
              └─ [6] process_document(doc.id) — RAG Pipeline:
                         │
                         ├─ parse_document() → document_text
                         │
                         ├─ Gemini.generate_content(RAG_SYSTEM_PROMPT + text)
                         │       → JSON: { summary, keywords, important_points,
                         │                 assigned_agent, is_relevant_to_ba }
                         │
                         └─ UPDATE documents SET
                                summary, keywords, important_points,
                                assigned_agent, rag_processed_at


┌─────────────────────────────────────────────────────────────────────┐
│                       SEND MESSAGE FLOW                              │
└─────────────────────────────────────────────────────────────────────┘

Frontend (chat-area)
  │
  ├─ [1] User gắn tài liệu (chọn từ dropdown existing docs)
  │
  └─ [2] POST /api/v1/projects/:id/conversations/:cid/messages
              body: { role, content, attachments: [{type, id, filename}] }
              │
              ├─ [3] Với mỗi attachment type=document:
              │       • Load Document từ DB
              │       • Nếu chưa có RAG → chạy process_document() ngay (lazy)
              │       • build_document_context_block(doc) → text block
              │
              ├─ [4] Ghép context vào agent_content:
              │       "{content}\n\n--- Tài liệu đính kèm ---\n{context}"
              │       (content gốc vẫn lưu vào DB, không lẫn context)
              │
              └─ [5] get_agent_reply(conv.id, agent_content)
                         → Agent nhận đầy đủ ngữ cảnh tài liệu
                         → Trả lời + nhận biết tài liệu có liên quan không
```

---

## 4. Frontend

### 4.1 `chat-input.tsx` — Validate khi chọn file mới

**File:** `frontend/features/conversations/components/chat-input.tsx`

Hàm `handleFileChange` kiểm tra từng file trước khi thêm vào state:

```typescript
const ACCEPTED = new Set([".txt", ".doc", ".docx", ".pdf", ".xlsx", ".xls"]);
const MAX_BYTES = 5 * 1024 * 1024;

Array.from(files).forEach((file) => {
  const ext = "." + (file.name.split(".").pop() ?? "").toLowerCase();
  if (!ACCEPTED.has(ext)) {
    toast.error(`"${file.name}" — định dạng không hỗ trợ...`);
    return;
  }
  if (file.size > MAX_BYTES) {
    toast.error(`"${file.name}" — vượt quá 500MB`);
    return;
  }
  validFiles.push(file);
});
```

`<input>` HTML cũng có `accept=".txt,.doc,.docx,.pdf,.xlsx,.xls"` để filter ở file picker.

**Khi nhấn Send**, `handleSend` build mảng `attachments`:

```typescript
attachments: MessageAttachment[] = [
  // Tài liệu đã upload (existing): { type: "document", id: 5, filename: "req.pdf" }
  // File mới (chưa upload):         { type: "file", filename: "draft.docx" }
]
```

→ Truyền vào `onSend(content, attachments)` → `chat-area.tsx` → `sendMessage.mutate`.

---

### 4.2 `upload-document-dialog.tsx` — Dialog upload tài liệu

**File:** `frontend/features/documents/components/upload-document-dialog.tsx`

Form gồm 3 trường:

| Trường      | Bắt buộc | Mục đích                                        |
| ----------- | -------- | ----------------------------------------------- |
| **File**    | ✅       | File cần upload                                 |
| **AI Task** | ❌       | Hướng dẫn cho AI (mặc định AI tự xử lý)         |
| **Notes**   | ❌       | Ghi chú cho người đọc (AI không dùng field này) |

Validation client-side (cùng logic với chat-input):

- `ACCEPTED_EXTS = Set(["pdf","docx","doc","txt","xlsx","xls"])`
- `MAX_FILE_SIZE = 100 * 1024 * 1024` (5MB)

---

### 4.3 `Document` TypeScript type

**File:** `frontend/features/documents/types.ts`

```typescript
export interface Document {
  id: number;
  project_id: number;
  filename: string;
  ai_task?: string | null;
  notes?: string | null;
  conversation_id?: number | null;
  // RAG fields (có sau khi AI xử lý xong)
  summary?: string | null;
  keywords?: string[];
  important_points?: string[];
  assigned_agent?: string | null; // "emma" | "sarah" | "jack" | "david" | "paul" | "alex"
  rag_processed_at?: string | null; // ISO datetime, null nếu chưa xử lý
  created_at: string;
}
```

---

## 5. Backend — Upload & Validation

### 5.1 `document_parser.py` — Parse file & đếm trang

**File:** `backend/app/services/document_parser.py`

```python
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".txt", ".xlsx", ".xls"}
MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024   # 100 MB
MAX_PAGE_COUNT = 300
```

Hàm chính: `parse_document(file_path) → { document_text, document_metadata }`

`document_metadata` luôn có key `page_count`:

| Định dạng | Cách lấy page_count                   |
| --------- | ------------------------------------- |
| PDF       | `len(PdfReader.pages)` — chính xác    |
| DOCX/DOC  | `ceil(word_count / 300)` — ước lượng  |
| TXT       | `ceil(char_count / 1800)` — ước lượng |
| XLSX/XLS  | `len(wb.worksheets)` — theo số sheets |

---

### 5.2 `documents.py` API — Upload endpoint

**File:** `backend/app/api/documents.py`  
**Endpoint:** `POST /api/v1/projects/:project_id/documents`

**Form data:**

```
file           (required)  File cần upload
conversation_id            ID conversation liên quan (optional)
ai_task                    Hướng dẫn cho AI (optional)
notes                      Ghi chú người dùng (optional)
```

**Flow xử lý:**

```python
# 1. Check định dạng
suffix not in ALLOWED_EXTENSIONS → 400

# 2. Đọc vào memory, check size
file_bytes = file.read()
len(file_bytes) > MAX_FILE_SIZE_BYTES → 400

# 3. Lưu file
file_path.write_bytes(file_bytes)

# 4. Parse → check số trang
parsed = parse_document(file_path)
parsed["document_metadata"]["page_count"] > MAX_PAGE_COUNT → 400 + xóa file

# 5. Lưu DB
doc = Document(...)
db.session.commit()

# 6. RAG (synchronous)
process_document(doc.id)
db.session.refresh(doc)

# 7. Return doc.to_dict() với đầy đủ RAG fields
```

---

## 6. RAG Pipeline

### 6.1 `document_rag.py`

**File:** `backend/app/services/document_rag.py`

#### Hàm `process_document(document_id)`

Chạy toàn bộ pipeline RAG cho 1 document. Gọi sau khi upload thành công.

**Bước 1 — Parse:**

```python
parsed = parse_document(doc.file_path)
document_text = parsed["document_text"][:12_000]  # truncate 12k chars
```

**Bước 2 — Gemini extraction:**

Prompt gửi Gemini yêu cầu trả về JSON thuần:

```json
{
  "summary": "2-4 câu tóm tắt nội dung...",
  "keywords": ["req-001", "stakeholder", "..."],
  "important_points": ["Điểm 1...", "Điểm 2..."],
  "assigned_agent": "emma",
  "is_relevant_to_ba": true
}
```

**Bước 3 — Lưu vào DB:**

```python
doc.summary = data["summary"]
doc.keywords = json.dumps(data["keywords"])       # lưu JSON string
doc.important_points = json.dumps(data["important_points"])
doc.assigned_agent = data["assigned_agent"]
doc.rag_processed_at = datetime.utcnow()
```

#### Hàm `build_document_context_block(document)`

Tạo text block inject vào prompt agent khi user gắn tài liệu vào message:

```
[ATTACHED DOCUMENT: requirements_v2.pdf]
Summary: Tài liệu mô tả yêu cầu hệ thống cho module đăng nhập...
Keywords: authentication, login, OAuth, SSO, session
Important points:
  - OAuth 2.0 là phương thức xác thực chính
  - Session timeout sau 30 phút không hoạt động
  - ...
Primary agent: emma
User instruction for this document: Kiểm tra tính nhất quán của requirements
User notes (for reference only): Phiên bản được duyệt bởi PM ngày 15/02
```

---

### 6.2 Agent Assignment

Gemini tự chọn agent dựa trên nội dung tài liệu:

| Agent | ID      | Loại tài liệu phù hợp                             |
| ----- | ------- | ------------------------------------------------- |
| Emma  | `emma`  | Requirements, user stories, functional specs      |
| Sarah | `sarah` | Stakeholder feedback, interview notes             |
| Jack  | `jack`  | Process flows, BPMN, workflow diagrams            |
| David | `david` | Compliance, regulations, business rules, policies |
| Paul  | `paul`  | Traceability matrix, RTM, test cases              |
| Alex  | `alex`  | Tổng quát, mixed, không rõ loại                   |

---

## 7. Gửi tin nhắn kèm tài liệu

### 7.1 Frontend gửi gì?

`POST /api/v1/projects/:id/conversations/:cid/messages`

```json
{
  "role": "user",
  "content": "Phân tích tài liệu này và cho tôi biết các gap requirements",
  "attachments": [
    { "type": "document", "id": 5, "filename": "requirements_v2.pdf" }
  ]
}
```

### 7.2 Backend xử lý trong `messages.py`

```python
attachments = data.get("attachments") or []
document_context_blocks = []

for att in attachments:
    if att["type"] == "document" and att["id"]:
        doc = Document.query.filter_by(id=att["id"], project_id=project_id).first()
        if doc:
            if not doc.rag_processed_at:          # lazy fallback
                process_document(doc.id)
                db.session.refresh(doc)
            block = build_document_context_block(doc)
            document_context_blocks.append(block)

# agent_content = nội dung mở rộng gửi cho Gemini
agent_content = content  # mặc định
if document_context_blocks:
    agent_content = f"{content}\n\n--- Tài liệu đính kèm ---\n{context}"

# Message lưu DB vẫn là "content" gốc (clean)
msg = Message(role="user", content=content, ...)

# Agent nhận agent_content (có context)
reply_text, agents = get_agent_reply(conv.id, agent_content)
```

**Điểm quan trọng:** Message lưu DB (`content`) là nội dung sạch của user, không lẫn RAG context. RAG context chỉ tồn tại trong `agent_content` trong memory của request.

### 7.3 Agent nhận biết tài liệu không liên quan

Vì RAG context block chứa `is_relevant_to_ba` (tính từ kết quả Gemini lúc upload) và context mô tả nội dung, agent có đủ thông tin để tự quyết định:

- Nếu tài liệu liên quan → phân tích theo vai trò (Emma kiểm tra requirements, David kiểm tra compliance...)
- Nếu tài liệu không liên quan (invoice, source code game, v.v.) → agent thông báo và không phân tích sâu → tiết kiệm tài nguyên

---

## 8. Database Schema

### Bảng `documents` (sau migration)

```sql
CREATE TABLE documents (
  id               INTEGER PRIMARY KEY,
  project_id       INTEGER NOT NULL,
  conversation_id  INTEGER,
  filename         VARCHAR(512) NOT NULL,
  file_path        VARCHAR(1024) NOT NULL,
  ai_task          TEXT,                -- hướng dẫn cho AI (user cung cấp khi upload)
  notes            TEXT,                -- ghi chú cho người đọc (AI bỏ qua)
  -- RAG fields (populated by process_document)
  summary          TEXT,                -- tóm tắt 2-4 câu
  keywords         TEXT,                -- JSON array: ["kw1","kw2",...]
  important_points TEXT,                -- JSON array: ["point1","point2",...]
  assigned_agent   VARCHAR(32),         -- "emma"|"sarah"|"jack"|"david"|"paul"|"alex"
  rag_processed_at DATETIME,            -- NULL = chưa xử lý RAG
  created_at       DATETIME
);
```

> `keywords` và `important_points` lưu dạng **JSON string** trong SQLite (vì SQLite không có kiểu array). Khi đọc ra, `to_dict()` tự `json.loads()` trả về list Python/TypeScript.

### Migration (tự động khi khởi động)

`db_migrate.py` có `migrate_add_documents_rag_fields(app)` — chạy mỗi lần app khởi động, tự `ALTER TABLE` nếu column chưa tồn tại (safe với DB cũ).

---

## 9. Danh sách file liên quan

```
frontend/
  features/
    conversations/
      components/
        chat-input.tsx          ← Validate file khi chọn + build attachments[]
        chat-area.tsx           ← Upload document + pass attachments khi send
        message-bubble.tsx      ← Hiển thị attachment chips trong message
    documents/
      types.ts                  ← Document interface (có RAG fields)
      api.ts                    ← uploadDocumentApi, error message cập nhật
      components/
        upload-document-dialog.tsx  ← Dialog upload với validation 5MB/format

backend/
  app/
    services/
      document_parser.py        ← Parse file, đếm trang, ALLOWED_EXTENSIONS
      document_rag.py           ← RAG pipeline: Gemini extract + build context block
    models/
      document.py               ← Document model với 5 RAG columns
    api/
      documents.py              ← Upload endpoint: validate + save + trigger RAG
      messages.py               ← create_message: inject document context vào agent
    db_migrate.py               ← Migration tự động thêm RAG columns
    __init__.py                 ← Đăng ký migrate_add_documents_rag_fields
```

---

## 10. Điểm cần lưu ý / Biết trước khi sửa

### RAG chạy đồng bộ (synchronous)

Upload request sẽ chờ Gemini xong mới trả về. Ưu điểm: response có đủ RAG data ngay. Nhược điểm: nếu file lớn hoặc Gemini chậm, user phải đợi. Nếu cần cải thiện sau: chuyển sang background task (Celery, threading).

### Lazy RAG fallback

Nếu vì lý do nào đó RAG pipeline bị lỗi lúc upload (`rag_processed_at = NULL`), khi user gắn tài liệu vào message, backend sẽ **tự chạy lại RAG** trước khi build context. Đây là safety net, không phải flow chính.

### Trang tính theo ước lượng (DOCX/TXT)

DOCX và TXT không có khái niệm "trang" cứng, nên hệ thống ước lượng. Ước lượng có thể sai ±1-2 trang — có thể điều chỉnh hệ số `300` (words/page) và `1800` (chars/page) trong `document_parser.py`.

### `keywords` và `important_points` lưu JSON string

Trong `Document` model, 2 column này là `TEXT` chứa JSON. `to_dict()` tự parse trả list. Nếu có lỗi parse (dữ liệu corrupt), fallback về `[]` — không raise exception.

### Agent `assigned_agent` chỉ là metadata

`assigned_agent` lưu trong DB là gợi ý của Gemini, nhưng **không override** routing logic trong `agent_router.py`. Agent được chọn trả lời vẫn theo router dựa trên nội dung chat. `assigned_agent` chỉ xuất hiện trong context block inject vào prompt — agent đọc và biết tài liệu này "thuộc về" agent nào.

### Context inject, message DB vẫn sạch

`agent_content` (có RAG context) chỉ tồn tại trong memory của request. Message lưu vào DB là `content` gốc của người dùng. Khi GET messages về, client không thấy context — đây là thiết kế có chủ đích để tránh làm lộn conversation history.
