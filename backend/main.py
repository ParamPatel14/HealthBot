from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database.connection import connect_db, close_db
from database.seed import seed_database
from routes import auth, sessions, reports, doctors, notifications, chat
from config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_db()
    await seed_database()
    print(f"🚀 Backend running on {settings.HOST}:{settings.PORT}")
    yield
    # Shutdown
    await close_db()


app = FastAPI(
    title="Healthcare AI Platform",
    description="FastAPI backend with LangChain multi-agent system and MongoDB",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routes
app.include_router(auth.router)
app.include_router(sessions.router)
app.include_router(reports.router)
app.include_router(doctors.router)
app.include_router(notifications.router)
app.include_router(chat.router)


@app.get("/")
async def root():
    return {"message": "Healthcare AI Platform API", "status": "running"}


@app.get("/api/specializations")
async def get_specializations():
    from database.seed import SPECIALIZATIONS
    return SPECIALIZATIONS


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
