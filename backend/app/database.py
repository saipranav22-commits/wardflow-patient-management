"""
Database configuration, session management, and lifecycle for WardFlow.
Supports persistent local SQLite and production PostgreSQL (Neon).
"""

import os
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session

# Fetch database connection URL from environment
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./patients.db")

# Normalize postgres:// to postgresql:// if needed (e.g. from Render or older tools)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

is_sqlite = DATABASE_URL.startswith("sqlite")

engine_kwargs = {}
if is_sqlite:
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # PostgreSQL production pool settings
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_recycle"] = 300
    engine_kwargs["pool_size"] = 5
    engine_kwargs["max_overflow"] = 10

engine = create_engine(DATABASE_URL, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency yielding a transactional database session per request.
    Rolls back automatically on unhandled exceptions and closes cleanly.
    """
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def init_db() -> None:
    """
    Create tables idempotently without modifying or dropping existing patient records.
    """
    # Import models here so Base knows about all registered tables
    from app import models  # noqa: F401
    Base.metadata.create_all(bind=engine)
