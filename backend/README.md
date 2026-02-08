# BAWS Backend (Flask)

Flask API cho BAWS - quản lý projects, documents và chạy analysis với Gemini agents.

## Yêu cầu

- Python 3.10+
- pip

## Cài đặt

1. **Tạo môi trường ảo (khuyến nghị):**
   ```bash
   cd backend
   python3 -m venv .venv
   source .venv/bin/activate   # Linux/macOS
   # hoặc: .venv\Scripts\activate   # Windows
   ```

2. **Cài dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Cấu hình:**
   - Copy `../.env.example` thành `../.env` ở thư mục workspace root
   - Thêm `GEMINI_API_KEY` vào `.env`
   - Copy `../_config/config.yaml.example` thành `../_config/config.yaml` (tự động nếu chưa có)

## Chạy backend

**Cách 1 (khuyến nghị) – chạy từ thư mục backend:**
```bash
cd backend
python3 run.py
```

**Cách 2 – chạy từ workspace root:**
```bash
python3 backend/run.py
```

Server mặc định chạy tại: **http://localhost:5000**

### Biến môi trường

| Biến | Mặc định | Mô tả |
|------|----------|-------|
| `PORT` | 5000 | Port chạy server |
| `FLASK_RELOAD` | 0 | Bật reloader khi sửa code (1/true/yes). Tắt mặc định để tránh lỗi reloader |
| `GEMINI_API_KEY` | - | API key Gemini (lấy tại https://aistudio.google.com/app/apikey) |

### Ví dụ

```bash
# Port 5050
PORT=5050 python3 run.py

# Bật reloader khi dev (chỉ dùng khi chạy từ thư mục backend/)
cd backend && FLASK_RELOAD=1 python3 run.py
```

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/v1/health` | Health check |
| GET | `/api/v1/projects` | Danh sách projects |
| POST | `/api/v1/projects` | Tạo project |
| GET | `/api/v1/projects/:id` | Chi tiết project |
| PUT | `/api/v1/projects/:id` | Cập nhật project |
| DELETE | `/api/v1/projects/:id` | Xóa project |
| POST | `/api/v1/projects/:id/documents` | Upload document |
| GET | `/api/v1/projects/:id/documents` | Danh sách documents |
| POST | `/api/v1/projects/:id/analyze` | Chạy analysis (body: `{"document_id": 1}`) |
| GET | `/api/v1/analyses/:id` | Lấy kết quả analysis |

## Data

- **Database:** `data/database/baws.db` (SQLite)
- **Documents:** `data/documents/{project_id}/`
- **Analysis output:** `data/output/analysis/{project_id}/`

Tất cả nằm trong thư mục workspace, dễ backup và xóa.
