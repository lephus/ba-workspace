# Figma AI Design Prompt – BAWS Web App (Single Page, GPT-style, Dark Theme)

Dùng prompt dưới đây với Figma AI (hoặc Figma’s AI design feature) để tạo thiết kế một trang web duy nhất, giao diện kiểu GPT, sidebar trái là danh sách dự án và khi mở rộng dự án thì hiện tài liệu + hội thoại.

---

## Prompt chính (copy nguyên block này)

```
Design a single-page web application with a dark theme as the primary theme. The layout should feel simple and familiar like ChatGPT.

**Layout structure:**
- Left sidebar (collapsible): fixed width when open, narrow icon-only when collapsed. Contains:
  - A header area with app logo/name (e.g. "BAWS") and a collapse/expand control.
  - A "New project" or "+ New project" button.
  - A scrollable list of projects. Each project is a row with:
    - Project name (truncated if long).
    - A chevron or arrow to expand/collapse the project.
  - When a project is expanded, show below it (indented):
    - A "Documents" section: list of document items (icon + filename, e.g. "requirements.pdf").
    - A "Conversations" section: list of conversation items (icon + conversation title or preview, e.g. "Discussion about R-001").
  - Sidebar background and text should follow the dark theme (e.g. dark gray/charcoal background, light gray/white text, subtle borders).

- Main content area (right side): takes remaining width. Contains:
  - A top bar: current project name (or "Select a project" when none), optional user/account area.
  - A central chat-like area: message list (user messages and assistant/agent messages, alternating or with clear visual distinction). Messages have avatar/icon, sender label, and content block. Use a dark background for the main area with good contrast for message bubbles (e.g. slightly lighter/darker bubbles for user vs assistant).
  - A bottom input area: text input (single or multi-line) and a send button, fixed at the bottom. Style to match dark theme (e.g. dark input background, light placeholder text).

**Visual style:**
- Dark theme: primary background dark (e.g. #1a1a1a, #0d0d0d, or #111). Sidebar slightly different shade (e.g. #161616) to separate from main area.
- Text: primary text light gray or white (#e5e5e5, #f5f5f5). Secondary/muted text mid gray (#9ca3af, #6b7280).
- Accents: one primary accent color for buttons and links (e.g. blue #3b82f6 or green #10b981). Use sparingly for "New project", send button, and selected/active states.
- Borders: very subtle (e.g. #2d2d2d, #333) to separate sidebar from content and to separate messages.
- Typography: clean sans-serif (e.g. Inter, system-ui). Clear hierarchy: project names and section titles slightly bolder; document/conversation names and message content readable size (e.g. 14–16px body).

**Interactions to suggest in the design:**
- Sidebar: collapsed state (icons only) and expanded state (with labels).
- Project row: default and expanded state (showing Documents and Conversations).
- One or two example user and assistant messages in the main area to show the chat pattern.
- Input area: default state and optional focus/hover state.

Keep the UI minimal and uncluttered, similar to ChatGPT: no heavy borders, no unnecessary panels. Focus on the sidebar (projects → documents, conversations) and the main chat area with a clear, dark theme.
```

---

## Prompt ngắn (nếu giới hạn ký tự)

```
Single-page web app, dark theme only. Layout: (1) Left sidebar: logo, "New project", list of projects; each project expandable to show "Documents" (file list) and "Conversations" (chat list). Sidebar collapsible to icons only. (2) Main area: top bar with project name, chat-style message list (user + assistant bubbles), bottom text input + send button. Style: dark backgrounds (#1a1a1a, #161616), light text (#e5e5e5), one accent color for buttons (#3b82f6). Clean sans-serif, minimal like ChatGPT. Show expanded project state and sample messages.
```

---

## Gợi ý thêm cho Figma AI

- Nếu AI hỏi “mobile hay desktop”: trả lời **desktop first** (e.g. 1440×900 hoặc 1280×720).
- Nếu AI hỏi “có cần thêm trang nào không”: trả lời **chỉ 1 trang duy nhất**, mọi thứ trên cùng một màn hình (sidebar + main).
- Nếu cần nhấn mạnh dark theme: thêm câu *“Strictly dark theme only: no light mode. All backgrounds dark, all text light or muted.”*

Sau khi có design từ Figma AI, bạn có thể chỉnh lại spacing, màu, hoặc copy vào file Figma chính để đồng bộ với design system (nếu có).
