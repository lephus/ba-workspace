# BA Workspace

**BA Workspace** is an AI-powered workspace for Business Analysts that turns scattered requirements, interviews, and stakeholder conversations into a traceable, structured **knowledge graph**.

## What's in the system?

- **Backend (Python/Flask)**: API for projects, documents, conversations, and AI integration (Google Gemini).
- **Frontend (Next.js)**: Web UI to create projects, upload documents, chat with AI, and manage conversations.
- **Data**: Stored in the `data/` folder (SQLite database, documents, analysis output).

You only need **one command** (or script) to run both backend and frontend, then open your browser to try it.

---

## Prerequisites

- **Python 3** (to run the backend)
- **Node.js 18+** (to run the web UI)
- **Google Gemini API key** (free): used for AI features in the app

---

## Step 1: Create the `.env` config file

The app reads environment variables from a **`.env`** file in the project root (same level as `start.sh`). If you don’t have this file yet, follow the steps below.

### 1.1. Copy from the template

- In the project root, copy **`.env.example`** to **`.env`**.
- On macOS/Linux (Terminal):

  ```bash
  cp .env.example .env
  ```

- Or copy manually: create a new file named `.env` and paste the contents from `.env.example`.

### 1.2. Edit `.env`

Open **`.env`** in a text editor (Notepad, VS Code, TextEdit, etc.) and:

1. Find the line **`GEMINI_API_KEY=your_gemini_api_key_here`**.
2. Replace **`your_gemini_api_key_here`** with your real API key.
3. (Optional) You can leave the other lines as-is for local use:
   - `BE_PORT=5050` — backend port
   - `NEXT_PUBLIC_API_URL=http://localhost:5050/api/v1` — API URL used by the frontend

**Get a free Gemini API key:**  
👉 https://aistudio.google.com/app/apikey

After saving `.env`, you can run the application.

---

## Step 2: Run the application

### Easy way (recommended): use the `start.sh` script

The script will:

- Check for Python 3 and Node.js
- Create `.env` from `.env.example` if missing and prompt you to add your API key
- Install backend (Python) and frontend (Node) dependencies
- Start the backend (port 5050) and web UI (port 3000)

**How to run:**

1. Open Terminal (macOS/Linux) or Git Bash (Windows).
2. Go to the project root (where `start.sh` is located).
3. Run:

   ```bash
   ./start.sh
   ```

4. When you see "Open your browser and go to…", open your browser and visit:

   **http://localhost:3000**

5. To stop: press **Ctrl+C** in the terminal where `start.sh` is running.

### Manual run (if you prefer the command line)

1. **Create and edit `.env`** as in Step 1.
2. **Backend:**

   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate   # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   cd ..
   python3 backend/run.py
   ```

3. **Frontend** (in a new terminal):

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. Open your browser: **http://localhost:3000**.

---

## Summary

| Item       | Description                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------- |
| **About**  | BA Workspace – AI app for BAs; turns requirements and conversations into a knowledge graph.                   |
| **Config** | Create `.env` from `.env.example`. Add your Gemini API key via the app UI after launch (Settings → API Keys). |
| **Run**    | From project root: `./start.sh` → open http://localhost:3000.                                                 |
| **Stop**   | Press Ctrl+C in the terminal running `start.sh`.                                                              |

If something fails, double-check that `.env` exists with the correct port settings.
