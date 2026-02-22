## Healthcare AI Platform (HealthBot)

HealthBot is an end‑to‑end AI‑assisted healthcare platform that:

- Lets **patients** chat with an AI triage agent, get routed to the right specialist, and receive doctor‑validated reports.
- Gives **doctors** a portal to review AI‑generated reports, add corrections and recommendations, and finalize them for patients.

Under the hood it combines:

- **FastAPI + MongoDB** backend with LangChain + Gemini multi‑agent triage/specialist system, persistent chat sessions, and report workflow.
- **React + Vite** frontend with a patient dashboard, doctor dashboard, AI chat UI, and report viewer.

Use this README to:

- Understand what the project does and how the main flows work.
- Learn how the backend and frontend are structured.
- Set up everything from scratch and run the full stack locally.

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

## Architecture & Codebase Walkthrough

This section summarizes “how the app works” and where to look in the code.

### High‑Level Flow

1. **Patient** lands on the marketing page, registers, and logs in.
2. Patient starts a **triage chat** with an AI agent, describing symptoms.
3. The triage agent:
   - Uses chat history as context.
   - Optionally decides which **specialization** is appropriate.
4. The system creates a **specialist session** for that specialization.
5. The specialist agent generates a structured **AI report**.
6. A seeded **doctor** sees the report in the doctor portal, reviews it, and submits a final report.
7. The patient is notified and can read the doctor‑validated report in their dashboard.

### Backend (FastAPI) Overview

Backend entrypoint: [`server/main.py`](file:///c:/Projects/HealthBot/server/main.py)

- Creates the FastAPI app and configures:
  - CORS for the React dev server.
  - Startup/shutdown `lifespan`:
    - Connects to MongoDB (`database/connection.py`).
    - Seeds doctors and specializations (`database/seed.py`).
- Registers all routers:
  - `auth`, `sessions`, `reports`, `doctors`, `notifications`, `chat`.

Key backend modules:

- **Config & database**
  - [`config.py`](file:///c:/Projects/HealthBot/server/config.py):
    - Loads `MONGODB_URL`, `DATABASE_NAME`, `GEMINI_API_KEY`, `HOST`, `PORT` via `pydantic-settings` + `.env`.
    - Central place to change environment‑specific config.
  - [`database/connection.py`](file:///c:/Projects/HealthBot/server/database/connection.py):
    - Manages the `AsyncIOMotorClient` and exposes `get_db()` to other modules.
    - Creates indexes on collections (users, sessions, reports, notifications).
  - [`database/seed.py`](file:///c:/Projects/HealthBot/server/database/seed.py):
    - Defines `SPECIALIZATIONS` and `SEED_DOCTORS`.
    - On startup:
      - Inserts doctors into `doctors` collection.
      - Creates matching `users` with role `"doctor"` and password `doctor123`.
      - Inserts specialization documents into `specializations` collection.

- **Models (data contracts)**
  - [`models/user.py`](file:///c:/Projects/HealthBot/server/models/user.py) (not shown above but present):
    - Pydantic models for registration, login, profile update and API responses.
  - [`models/session.py`](file:///c:/Projects/HealthBot/server/models/session.py):
    - Session and message schemas (type, specialization, attachments, etc.).
  - [`models/report.py`](file:///c:/Projects/HealthBot/server/models/report.py):
    - Structures doctor review input and final report content.

- **Routes (HTTP API)**
  - [`routes/auth.py`](file:///c:/Projects/HealthBot/server/routes/auth.py):
    - `/api/auth/register` – create patient accounts with hashed password (`passlib`).
    - `/api/auth/login` – verify credentials and return user profile.
    - `/api/auth/profile/{user_id}` – update user profile (demographics, emergency contact).
    - `/api/auth/user/{user_id}` – fetch a user (supports doctor IDs as well).
  - [`routes/sessions.py`](file:///c:/Projects/HealthBot/server/routes/sessions.py):
    - `/api/sessions` – create chat sessions:
      - `type="triage"` or `type="specialist"`.
      - Specialist sessions can silently import the last completed triage transcript as context.
    - `/api/sessions/user/{user_id}` – list all sessions for a user (used by patient dashboard).
    - `/api/sessions/{session_id}` – get session details and uploads.
  - [`routes/chat.py`](file:///c:/Projects/HealthBot/server/routes/chat.py):
    - `/api/chat/{session_id}/send`:
      - Saves user message to MongoDB.
      - Fetches full chat history as agent memory.
      - Routes to **triage** or **specialist** agent:
        - Triage: `agents/triage_agent.py`
        - Specialist: `agents/specialist_agent.py`
      - Saves agent response and returns both messages to the frontend.
      - If the triage agent decides to “route”, it sets `routeTo` so the frontend can open a specialist chat.
      - If the specialist agent returns a `report`, it:
        - Inserts a document in `reports` collection.
        - Links it to the session.
        - Notifies the assigned doctor.
    - `/api/chat/{session_id}/messages` – fetch full message list for a session.
  - [`routes/reports.py`](file:///c:/Projects/HealthBot/server/routes/reports.py):
    - `/api/reports` – list all reports for a patient.
    - `/api/reports/pending` – list reports waiting for doctor review.
    - `/api/reports/{report_id}` – get a single report.
    - `/api/reports/{report_id}/review` – doctor submits review:
      - Merges AI and doctor content into a final report.
      - Adds a system message to the session.
      - Creates a patient notification.
  - [`routes/doctors.py`](file:///c:/Projects/HealthBot/server/routes/doctors.py):
    - CRUD‑style endpoints to fetch doctors, optionally by specialization.
  - [`routes/notifications.py`](file:///c:/Projects/HealthBot/server/routes/notifications.py):
    - Fetch notifications for a user, unread count, and mark as read.

- **AI Agents**
  - [`agents/triage_agent.py`](file:///c:/Projects/HealthBot/server/agents/triage_agent.py):
    - Uses `ChatGoogleGenerativeAI` (Gemini) via LangChain.
    - Takes full session message history and patient name.
    - Responsible for:
      - Conversational triage.
      - Deciding when to route to a specialist (returns `route_to`).
  - [`agents/specialist_agent.py`](file:///c:/Projects/HealthBot/server/agents/specialist_agent.py):
    - Also built on `ChatGoogleGenerativeAI`.
    - Uses specialization ID + message history to generate:
      - Structured `aiReport` (summary, findings, suggestions, etc.).
      - Human‑readable explanation for the patient.

Overall, the backend is designed so that:

- MongoDB is the source of truth for users, doctors, sessions, messages, reports, notifications.
- LangChain + Gemini are pure stateless LLM calls on top of that persistent context.

### Frontend (React) Overview

Entry file: [`client/src/main.jsx`](file:///c:/Projects/HealthBot/client/src/main.jsx)  
App root: [`client/src/App.jsx`](file:///c:/Projects/HealthBot/client/src/App.jsx)

- Sets up **React Router**:
  - Public routes: `/` (Landing), `/login`, `/register`.
  - Protected routes: mounted under `ProtectedLayout`:
    - Patient dashboard, profile, chat history, reports.
    - Chat views (triage, routing, specialist).
    - Doctor dashboard and review pages.
- Wraps the app with:
  - `AuthProvider` (`contexts/AuthContext.jsx`) – handles login state, user info, role.
  - `ToastProvider` (`contexts/ToastContext.jsx`) – lightweight in‑app notifications/toasts.

Key frontend areas:

- **Layout**
  - [`components/layout/Navbar.jsx`](file:///c:/Projects/HealthBot/client/src/components/layout/Navbar.jsx):
    - Top navigation bar:
      - Links change based on role (`patient` vs `doctor`).
      - Shows avatar with user initials and dropdown menu (profile, chat history, logout).
  - [`components/layout/Sidebar.jsx`](file:///c:/Projects/HealthBot/client/src/components/layout/Sidebar.jsx):
    - Left sidebar inside the protected app:
      - Navigation links grouped by section (overview, reports, chat).
  - [`components/layout/ProtectedLayout.jsx`](file:///c:/Projects/HealthBot/client/src/components/layout/ProtectedLayout.jsx):
    - Guards all authenticated routes:
      - Redirects to `/login` if not logged in.
      - Renders Navbar + Sidebar + main content area.

- **Pages**
  - Landing / Auth:
    - [`pages/Landing.jsx`](file:///c:/Projects/HealthBot/client/src/pages/Landing.jsx):
      - Marketing hero, feature grid, “How it works” steps.
    - [`pages/Login.jsx`](file:///c:/Projects/HealthBot/client/src/pages/Login.jsx) and [`pages/Register.jsx`](file:///c:/Projects/HealthBot/client/src/pages/Register.jsx):
      - Role toggle (Patient / Doctor).
      - Forms wired to `/api/auth/register` and `/api/auth/login`.
  - Patient portal:
    - [`pages/patient/Dashboard.jsx`](file:///c:/Projects/HealthBot/client/src/pages/patient/Dashboard.jsx):
      - Overview cards (total consultations, pending/complete reports, active sessions).
      - Recent consultations and recent reports using `StatCard`, `Badge`, `EmptyState`.
    - [`pages/patient/Profile.jsx`](file:///c:/Projects/HealthBot/client/src/pages/patient/Profile.jsx):
      - Editable patient profile, emergency contact, etc.
    - [`pages/patient/ChatHistory.jsx`](file:///c:/Projects/HealthBot/client/src/pages/patient/ChatHistory.jsx) / `ChatView.jsx`:
      - List of past sessions and detailed conversation view.
    - [`pages/patient/ReportsList.jsx`](file:///c:/Projects/HealthBot/client/src/pages/patient/ReportsList.jsx) / `ReportView.jsx`:
      - List of reports and full doctor‑validated report viewer.
  - Chat flows:
    - [`pages/chat/TriageChat.jsx`](file:///c:/Projects/HealthBot/client/src/pages/chat/TriageChat.jsx):
      - Entry point for symptom description.
      - Creates a triage session and sends messages to `/api/chat/{session_id}/send`.
    - [`pages/chat/AgentRouting.jsx`](file:///c:/Projects/HealthBot/client/src/pages/chat/AgentRouting.jsx):
      - Transitional screen when routing from triage to specialist.
    - [`pages/chat/SpecialistChat.jsx`](file:///c:/Projects/HealthBot/client/src/pages/chat/SpecialistChat.jsx):
      - Specialist conversation UI with upload support (prescriptions, images, etc.).
  - Doctor portal:
    - [`pages/doctor/Dashboard.jsx`](file:///c:/Projects/HealthBot/client/src/pages/doctor/Dashboard.jsx):
      - High‑level overview for the doctor.
    - [`pages/doctor/PatientQueue.jsx`](file:///c:/Projects/HealthBot/client/src/pages/doctor/PatientQueue.jsx):
      - Queue of AI‑generated reports assigned to the doctor.
    - [`pages/doctor/DoctorReview.jsx`](file:///c:/Projects/HealthBot/client/src/pages/doctor/DoctorReview.jsx):
      - Detailed review UI where doctors can see the AI report and submit their corrections/notes, calling `/api/reports/{id}/review`.

- **Services & Constants**
  - [`services/api.js`](file:///c:/Projects/HealthBot/client/src/services/api.js):
    - Wrapper around `fetch` for talking to the FastAPI backend:
      - Auth, session management, chat, reports, notifications.
  - [`services/auth.js`](file:///c:/Projects/HealthBot/client/src/services/auth.js):
    - Login, register, persistence of auth state (e.g., localStorage).
  - [`services/constants.js`](file:///c:/Projects/HealthBot/client/src/services/constants.js):
    - Mirrors backend `SPECIALIZATIONS` and seeded `SEED_DOCTORS`.
    - Utility functions for status labels, IDs, dates, etc.

- **Design System**
  - [`src/index.css`](file:///c:/Projects/HealthBot/client/src/index.css):
    - Core theme variables (colors, radii, shadows, gradients).
    - Reusable classes:
      - `glass-card`, `badge-*`, `btn-*`, form components.
      - Layout for navbar, sidebar, landing page sections, chat layout, profile layout.

Together, the frontend is structured to:

- Keep routing and auth concerns in `App.jsx` + `AuthContext`.
- Keep API calls centralized in `services`.
- Provide reusable UI building blocks for cards, badges, chat bubbles, etc., defined in `components/ui`.

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
