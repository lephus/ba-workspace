# BAWS Backend (Flask)

Flask API for BAWS – manages projects, documents, and runs analysis with Gemini agents.

## Requirements

- Python 3.10+
- pip

## Setup

1. **Create virtual environment (recommended):**
   ```bash
   cd backend
   python3 -m venv .venv
   source .venv/bin/activate   # Linux/macOS
   # or: .venv\Scripts\activate   # Windows
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configuration:**
   - Copy `../.env.example` to `../.env` in the workspace root
   - Add `GEMINI_API_KEY` to `.env`
   - Copy `../_config/config.yaml.example` to `../_config/config.yaml` (done automatically if missing)

## Run the backend

**Option 1 (recommended) – from backend directory:**
```bash
cd backend
python3 run.py
```

**Option 2 – from workspace root:**
```bash
python3 backend/run.py
```

Server runs at: **http://localhost:5000**

**Swagger UI (Flasgger):** Open **http://localhost:5000/apidocs** to explore and try the API.

### Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 5000 | Server port |
| `FLASK_RELOAD` | 0 | Enable reloader when editing code (1/true/yes). Off by default to avoid reloader issues |
| `GEMINI_API_KEY` | - | Gemini API key (get at https://aistudio.google.com/app/apikey) |

### Examples

```bash
# Custom port
PORT=5050 python3 run.py

# Enable reloader for development (run from backend directory)
cd backend && FLASK_RELOAD=1 python3 run.py
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | Health check |
| GET | `/api/v1/projects` | List projects |
| POST | `/api/v1/projects` | Create project |
| GET | `/api/v1/projects/:id` | Get project |
| PUT | `/api/v1/projects/:id` | Update project |
| DELETE | `/api/v1/projects/:id` | Delete project |
| GET | `/api/v1/projects/:id/conversations` | List conversations |
| POST | `/api/v1/projects/:id/conversations` | Create conversation (body: `{"title": "..."}`) |
| GET | `/api/v1/projects/:id/conversations/:cid` | Get conversation |
| PUT | `/api/v1/projects/:id/conversations/:cid` | Update conversation |
| DELETE | `/api/v1/projects/:id/conversations/:cid` | Delete conversation |
| GET | `/api/v1/projects/:id/conversations/:cid/messages` | List messages |
| POST | `/api/v1/projects/:id/conversations/:cid/messages` | Add message. `content` can be a string or `{ "content_type": "text", "parts": ["..."] }`. When role=user, the BA agent replies; response includes `assistant_message` and `bot`. |
| POST | `/api/v1/projects/:id/documents` | Upload document (form: file, optional conversation_id) |
| GET | `/api/v1/projects/:id/documents` | List documents |
| DELETE | `/api/v1/projects/:id/documents/:doc_id` | Delete document |
| POST | `/api/v1/projects/:id/analyze` | Run analysis (body: `{"document_id": 1, "conversation_id": 1}`) |
| GET | `/api/v1/analyses/:id` | Get analysis result |

## Data

- **Database:** `data/database/baws.db` (SQLite)
- **Documents:** `data/documents/{project_id}/`
- **Analysis output:** `data/output/analysis/{project_id}/`

All under the workspace directory for easy backup and cleanup.

## Message content format (POST messages)

**Accepted `content`:**

1. **Plain string** (legacy): `"content": "your message"`

2. **Structured (GPT-style):**
   ```json
   "content": {
     "content_type": "text",
     "parts": [
       "First segment (e.g. a short message or paragraph).",
       "Second segment."
     ]
   }
   ```

**Rules for `parts`:**
- Each item is a string (logical segment: paragraph, bullet, or sentence).
- Backend trims each part and drops empty entries.
- Parts are joined with `\n\n` so the prompt has clear structure for the router and Gemini.
- Max 50 parts; total length capped for safety.

Stored and sent to the model: a single normalized text (the joined string). Responses (e.g. GET messages) still return `content` as that stored string.
