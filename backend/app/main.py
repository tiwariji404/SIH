from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routers import auth, users, stream
from app.db.session import engine, Base
from app.core.config import settings
import logging

try:
    # Ensure tables are created
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"DB Error: {e}")

app = FastAPI(title=settings.PROJECT_NAME)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(users.router, prefix=f"{settings.API_V1_STR}/users", tags=["users"])
app.include_router(stream.router, prefix=f"{settings.API_V1_STR}/stream", tags=["stream"])

@app.get("/")
def read_root():
    return {"message": "Welcome to AssistanCCTV AI Backend"}

@app.get("/healthz")
def healthcheck() -> dict:
    return {"ok": True}
