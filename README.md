## Healthcare AI Platform (HealthBot)

End‑to‑end healthcare assistant combining:

- **FastAPI + MongoDB** backend with LangChain + Gemini multi‑agent triage/specialist system
- **React + Vite** frontend for patients and doctors (dashboards, chat, reports)

This README explains how to set up everything from scratch and run the full stack locally.

---

## 1. Tech Stack

- **Frontend**
  - React 19, React Router
  - Vite dev/build tooling
  - Custom design system (glassmorphism + dark theme) in [`client/src/index.css`](file:///c:/Projects/HealthBot/client/src/index.css)

- **Backend**
  - FastAPI
  - Uvicorn (ASGI server, with reload in dev)
  - MongoDB via `motor` / `pymongo`
  - LangChain + `langchain-google-genai` + Google Gemini

---

## 2. Project Structure

```text
HealthBot/
  client/       # React + Vite frontend
    src/
      pages/        # Landing, Auth, Patient, Doctor, Chat
      components/   # Layout (Navbar, Sidebar) + UI (cards, badges, etc.)
      contexts/     # Auth + Toast providers
      services/     # API helpers and constants

  server/       # FastAPI backend
    agents/         # Triage and specialist AI agents (LangChain + Gemini)
    database/       # Mongo connection + seed logic
    models/         # Pydantic models for requests/responses
    routes/         # auth, sessions, reports, doctors, notifications, chat
    config.py       # Settings (Mongo URL, Gemini key, host/port)
    main.py         # FastAPI app entrypoint (Uvicorn in __main__)
```

---

## 3. Prerequisites

Make sure you have:

- **Node.js**: v18+ (recommended)
- **Python**: 3.11+ / 3.12
- **MongoDB**:
  - Local MongoDB running on `mongodb://localhost:27017`, **or**
  - A cloud instance (e.g. MongoDB Atlas) you can connect to
- **Google Gemini API key**:
  - Create one from Google AI Studio / Google Cloud

---

## 4. Backend Setup (FastAPI + MongoDB + Gemini)

From the project root:

```bash
cd server
```

### 4.1 (Optional) Create and activate a virtual environment

```bash
python -m venv venv
venv\Scripts\activate   # On Windows
# source venv/bin/activate   # On macOS / Linux
```

### 4.2 Install backend dependencies

```bash
pip install -r requirements.txt
```

Backend dependencies include:

- `fastapi`, `uvicorn[standard]`
- `motor`, `pymongo`
- `pydantic`, `pydantic-settings`, `python-dotenv`
- `passlib[bcrypt]`
- `langchain`, `langchain-google-genai`, `google-generativeai`

### 4.3 Configure environment variables

Copy the example env file and fill in your values:

```bash
cd server
copy .env.example .env   # On Windows
# cp .env.example .env   # On macOS / Linux
```

Open [server/.env](file:///c:/Projects/HealthBot/server/.env) and configure:

```env
MONGODB_URL=mongodb://localhost:27017       # or your MongoDB connection string
DATABASE_NAME=healthcare
GEMINI_API_KEY=your_real_gemini_api_key
HOST=0.0.0.0
PORT=8000
```

> The app will automatically:
> - Connect to MongoDB using `MONGODB_URL`
> - Seed specializations and doctors on startup

### 4.4 Run the backend (development)

From `server/`:

```bash
python main.py
```

This starts Uvicorn with reload:

- API root: `http://localhost:8000/`
- Interactive docs (Swagger UI): `http://localhost:8000/docs`

If you see `ServerSelectionTimeoutError` for MongoDB:

- Ensure MongoDB is running and reachable at your `MONGODB_URL`
- Or update `MONGODB_URL` in `.env` to a valid MongoDB Atlas URI

---

## 5. Frontend Setup (React + Vite)

From the project root:

```bash
cd client
npm install
```

### 5.1 Run the frontend (development)

From `client/`:

```bash
npm run dev
```

Vite will output something like:

- `http://localhost:5173/` (default)  
  If 5173 is busy, it may use `http://localhost:5174/` instead.

Open that URL in your browser.

> Note: The backend CORS config is set for `http://localhost:5173` and `http://localhost:3000`.  
> If you always run Vite on a different port, you can update `allow_origins` in [`server/main.py`](file:///c:/Projects/HealthBot/server/main.py#L28-L35).

---

## 6. Running the Full Stack

Use **two terminals**.

**Terminal 1 – Backend**

```bash
cd server
python main.py
```

Backend will:

- Connect to MongoDB
- Seed specializations and doctors on first run
- Serve the API at `http://localhost:8000`

**Terminal 2 – Frontend**

```bash
cd client
npm run dev
```

Frontend:

- Runs the React SPA (landing page, auth, dashboards, chat, reports)
- Connects to the FastAPI backend at `http://localhost:8000`

---

## 7. Using the App

### 7.1 Patient flow

1. Visit the frontend: `http://localhost:5173/` (or the port shown by Vite).
2. Click **Get Started** and create a **Patient** account.
3. Complete your profile.
4. Start a new consultation (triage chat).
5. The triage agent:
   - Collects your symptoms
   - Routes you to the correct specialization when needed
6. A specialist agent generates an AI report.
7. A real doctor (seeded account) reviews and finalizes the report, which appears in your **Reports** tab.

### 7.2 Doctor portal

The backend seeds 6 doctors for testing. Use the **Doctor** toggle on the login screen.

- **Global password for all doctors:** `doctor123`

| Specialization | Doctor Name       | Email Login                 |
| -------------- | ----------------- | --------------------------- |
| Cardiology     | Dr. Sarah Chen    | `sarah.chen@hal.health`    |
| Dermatology    | Dr. James Patel   | `james.patel@hal.health`   |
| Orthopedics    | Dr. Maria Gonzalez| `maria.gonzalez@hal.health`|
| Neurology      | Dr. Ahmed Khan    | `ahmed.khan@hal.health`    |
| Pulmonology    | Dr. David Lee     | `david.lee@hal.health`     |
| General        | Dr. Emily Woods   | `emily.woods@hal.health`   |

As a doctor you can:

- See your queue of AI‑generated reports awaiting review
- Open a report, add notes/corrections/recommendations
- Finalize the report, which:
  - Updates the report status
  - Sends a system message in the patient’s chat
  - Creates a notification for the patient

---

## 8. Production Notes (High‑Level)

This repo is set up primarily for local development. For production:

- Serve the backend with a proper ASGI process manager (e.g. `gunicorn` + `uvicorn.workers.UvicornWorker`).
- Build the frontend:

  ```bash
  cd client
  npm run build
  ```

- Serve the built frontend (`client/dist`) via a static file server (Nginx, CDN, etc.) and point it to your deployed FastAPI API URL.

---

## 9. Troubleshooting

- **MongoDB connection errors**
  - Check that Mongo is running and reachable.
  - Verify `MONGODB_URL` in `.env`.

- **CORS errors in browser**
  - Confirm frontend is served from an origin allowed in FastAPI CORS config (`server/main.py`).

- **Missing Python packages**
  - Re‑run:
    ```bash
    cd server
    pip install -r requirements.txt
    ```

- **Node dependency issues**
  - Delete `client/node_modules` and reinstall:
    ```bash
    cd client
    rm -rf node_modules package-lock.json
    npm install
    ```
