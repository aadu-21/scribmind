"""
Engine setup.

Set DATABASE_URL in the Vercel project's environment variables to a
Postgres connection string (Vercel Postgres, Neon, Supabase, etc — anything
Postgres-compatible works). Vercel's serverless filesystem is ephemeral and
functions may run in fresh containers per-request, so SQLite is only
suitable for local development, never for the deployed app.
"""

import os
from sqlmodel import SQLModel, Session, create_engine

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./scribmind_dev.db")

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)


def init_db() -> None:
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
