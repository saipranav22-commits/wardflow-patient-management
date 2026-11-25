"""
Main FastAPI application entry point for WardFlow.
Configures middleware, routers, database initialization, and error handling.
"""

import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import List

from fastapi import FastAPI, Request, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import init_db, get_db
from app.routers import patients
from app.seed import seed_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan context:
    Initializes database tables and seeds demo data on cold start.
    """
    # Initialize tables
    init_db()

    # Automatically seed initial demo data if database is empty
    from app.database import SessionLocal
    db = SessionLocal()
    try:
        seed_database(db, force=False)
    finally:
        db.close()

    yield


app = FastAPI(
    title="WardFlow API",
    description="Patient Admission Management REST API for Indian Hospital Operations",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Parse configured origins
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
origins: List[str] = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
]
if allowed_origins_env:
    for item in allowed_origins_env.split(","):
        stripped = item.strip()
        if stripped and stripped not in origins:
            origins.append(stripped)

# Add CORS middleware with permissive regex for preview deployments
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https?://.*(onrender\.com|vercel\.app|github\.io|localhost).*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Format Pydantic validation errors into field-specific mappings
    for direct inline display in the React frontend.
    """
    errors_dict = {}
    error_messages = []

    for err in exc.errors():
        loc = err.get("loc", [])
        msg = str(err.get("msg", "Invalid value"))

        # Strip Pydantic prefixes like "Value error, "
        if msg.startswith("Value error, "):
            msg = msg[len("Value error, "):]

        # Extract field name (last element of loc usually)
        field = str(loc[-1]) if loc else "general"
        if field in ("body", "__root__"):
            field = "general"

        errors_dict[field] = msg
        error_messages.append(f"{field}: {msg}")

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        content={
            "detail": "; ".join(error_messages),
            "errors": errors_dict,
        },
    )


@app.get("/api/health", tags=["System"])
def health_check(db: Session = Depends(get_db)):
    """
    System health check verifying API operational status and database connectivity.
    """
    try:
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"unreachable: {str(e)}"

    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "service": "WardFlow Patient Admission API",
        "database": db_status,
        "environment": os.getenv("APP_ENV", "development"),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.post("/api/seed", tags=["System"])
def seed_demo_data(force: bool = False, db: Session = Depends(get_db)):
    """
    Seed or re-seed fictional patient demonstration records.
    Safe and non-destructive unless force=True.
    """
    count = seed_database(db, force=force)
    return {
        "success": True,
        "message": f"Successfully seeded {count} demo patient records.",
        "records_added": count,
    }


# Include patient routes
app.include_router(patients.router)


@app.get("/", tags=["System"])
def root():
    """Service landing endpoint with API documentation links."""
    return {
        "name": "WardFlow API",
        "description": "Patient Admission Management System",
        "docs": "/docs",
        "health": "/api/health",
        "version": "1.0.0",
    }
