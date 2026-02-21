# BAWS Workflow Diagrams trên Figma

Các workflow diagrams đã được tạo trên Figma/FigJam. Bạn có thể chỉnh sửa, export, hoặc chia sẻ các diagrams này.

---

## 📊 Diagram 1: Document Analysis Flow

**Tên**: BAWS Multi-Agent Workflow - Document Analysis Flow

**Mô tả**: Workflow chính cho Document Analysis, bao gồm:
- Document parsing
- Alex chạy sequential
- 4 Specialist agents chạy parallel
- Interactive clarification loop
- Output generation

**Link**: [Mở trong FigJam](https://www.figma.com/online-whiteboard/create-diagram/3bfe3094-da0d-47d9-b11d-9ad424286093?utm_source=other&utm_content=edit_in_figjam&oai_id=&request_id=274ad548-f0b3-47b9-bef5-fb61cf988642)

---

## 📊 Diagram 2: Agent Sequence Diagram

**Tên**: BAWS Agent Sequence Diagram

**Mô tả**: Sequence diagram chi tiết về thứ tự tương tác:
- User → System → Parser
- Alex chạy sequential
- 4 agents chạy parallel
- Clarification loop với user
- Output generation

**Link**: [Mở trong FigJam](https://www.figma.com/online-whiteboard/create-diagram/4739b07e-e765-4632-9922-eab8e22602bd?utm_source=other&utm_content=edit_in_figjam&oai_id=&request_id=3f6f5ffe-2a07-4a72-9abd-93c521457808)

---

## 📊 Diagram 3: Agent Coordination and Routing

**Tên**: BAWS Agent Coordination and Routing

**Mô tả**: Diagram về cách route các loại input khác nhau:
- Document Upload → Parser → Alex → Agents
- Text Input → Alex → Agents
- Question → Router → Specific Agent
- Output generation

**Link**: [Mở trong FigJam](https://www.figma.com/online-whiteboard/create-diagram/9f76f859-0f2c-4b29-90be-8ef9e641afc6?utm_source=other&utm_content=edit_in_figjam&oai_id=&request_id=5b8a1197-f62f-43cd-9f65-02cbdc1a7e2a)

---

## 🎨 Cách Sử Dụng Diagrams trên Figma

### Chỉnh sửa Diagrams
1. Click vào link để mở diagram trong FigJam
2. Bạn có thể:
   - Di chuyển các shapes
   - Thay đổi màu sắc và styling
   - Thêm text annotations
   - Thêm shapes mới
   - Kết nối các elements

### Export Diagrams
1. Chọn tất cả elements (Cmd/Ctrl + A)
2. Right-click → **Copy** hoặc **Export**
3. Export options:
   - PNG (cho presentation)
   - SVG (cho web)
   - PDF (cho documentation)

### Chia sẻ Diagrams
1. Click nút **Share** ở góc trên bên phải
2. Set permissions (View/Edit)
3. Copy link và gửi cho team

### Tổ chức Diagrams
- Tạo một **Figma File** mới
- Import các diagrams vào file đó
- Organize thành các pages/sections
- Thêm frame và labels

---

## 📝 Notes

- Tất cả diagrams được tạo bằng **Mermaid syntax** và convert sang FigJam
- Diagrams có thể được chỉnh sửa tự do trong FigJam
- Bạn có thể combine các diagrams thành một file lớn hơn
- Có thể thêm annotations, notes, và styling tùy chỉnh

---

## 🔄 Cập Nhật Diagrams

Nếu workflow thay đổi, bạn có thể:
1. Chỉnh sửa trực tiếp trong FigJam
2. Tạo diagram mới trực tiếp trong FigJam

---

## 📊 Diagram 4: Workflow với User Approval Loop

**Tên**: BAWS Workflow with User Approval Loop

**Mô tả**: Workflow với approval gate - tài liệu được trao đổi nhiều lần cho đến khi user approve:
- Analysis → Present Results → User Review
- User có thể Approve hoặc Reject
- Nếu Reject → Process Feedback → Update → Re-analyze
- Chỉ khi User Approve → mới Generate Output

**Link**: [Mở trong FigJam](https://www.figma.com/online-whiteboard/create-diagram/9fd03229-859a-4d58-b5cb-a17eca1636bf?utm_source=other&utm_content=edit_in_figjam&oai_id=&request_id=9fe4f649-d9aa-4a97-960a-7cb448ee6af9)

---

## 📊 Diagram 5: Iterative Approval Sequence

**Tên**: BAWS Iterative Approval Sequence

**Mô tả**: Sequence diagram về iterative approval loop:
- Loop cho đến khi user approve
- Present Results → User Review → Feedback → Re-analyze
- Approval Gate → Generate Output

**Link**: [Mở trong FigJam](https://www.figma.com/online-whiteboard/create-diagram/ce7e56a6-68f8-44f4-bba9-98855e661689?utm_source=other&utm_content=edit_in_figjam&oai_id=&request_id=31dd7988-bebc-4d70-8b6b-7aea53e0f33b)

---

## 📊 Diagram 6: Complete Workflow - All Flows

**Tên**: BAWS Complete Workflow - All Flows

**Mô tả**: Diagram tổng hợp tất cả các flows:
- Document Upload flow
- Text Input flow
- Q&A Routing flow
- Analysis với Approval Loop
- Output Generation

**Link**: [Mở trong FigJam](https://www.figma.com/online-whiteboard/create-diagram/d0b5faae-3a21-444a-aaee-f021d54be236?utm_source=other&utm_content=edit_in_figjam&oai_id=&request_id=c4f76fb1-901c-4b9e-a123-7dad15d16959)

---

## 📚 Related Files

- `workflow.md` - Workflow definition chính
- `steps/` - Workflow step definitions
