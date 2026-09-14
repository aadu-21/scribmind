"""
Scribmind API.

This gives Scribmind real accounts and multi-device persistence beyond the
browser's localStorage (which the frontend uses on its own and works fine
standalone, unauthenticated). It is intentionally a thin, resource-oriented
REST API rather than a full sync/conflict-resolution engine — each
resource is fetched and replaced as a whole document, "last write wins",
which matches how a single student actually uses the app day to day.

Local dev:   uvicorn api.index:app --reload --port 8000
Deployed:    Vercel builds this file automatically as a serverless
             function; see vercel.json for the routing rewrite that
             sends /api/* here.
"""

from contextlib import asynccontextmanager
from datetime import datetime, timezone
import secrets

from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select

try:
    # Local dev via `uvicorn api.index:app`
    from . import models, auth
    from .db import init_db, get_session
except ImportError:
    # Vercel's Python runtime imports this file directly (not as a
    # package), with this directory on sys.path.
    import models  # type: ignore
    import auth  # type: ignore
    from db import init_db, get_session  # type: ignore


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="Scribmind API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten to your deployed frontend origin in production
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_current_user(
    authorization: str | None = Header(default=None),
    session: Session = Depends(get_session),
) -> models.User:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "Missing or malformed Authorization header")
    token = authorization.split(" ", 1)[1]
    user_id = auth.verify_token(token)
    if not user_id:
        raise HTTPException(401, "Invalid or expired session")
    user = session.get(models.User, user_id)
    if not user:
        raise HTTPException(401, "Account no longer exists")
    return user


@app.get("/api/health")
def health():
    return {"status": "ok"}


# ----------------------------------------------------------------- Auth --

@app.post("/api/auth/signup")
def signup(body: dict, session: Session = Depends(get_session)):
    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""
    name = (body.get("name") or "").strip()
    if not email or "@" not in email:
        raise HTTPException(400, "Enter a valid email address")
    if len(password) < 8:
        raise HTTPException(400, "Password must be at least 8 characters")
    if not name:
        raise HTTPException(400, "Enter your name")

    existing = session.exec(select(models.User).where(models.User.email == email)).first()
    if existing:
        raise HTTPException(409, "An account with that email already exists")

    user = models.User(
        id=f"user_{secrets.token_urlsafe(12)}",
        email=email,
        name=name,
        password_hash=auth.hash_password(password),
        created_at=datetime.now(timezone.utc).isoformat(),
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    # Seed a fresh account with the same defaults the local-only app starts with.
    default_columns = [
        ("backlog", "Backlog", 0, None),
        ("todo", "To Do", 1, None),
        ("in_progress", "In Progress", 2, 3),
        ("review", "Review", 3, None),
        ("done", "Done", 4, None),
    ]
    for cid, cname, order, wip in default_columns:
        session.add(models.KanbanColumn(id=f"{cid}_{user.id}", user_id=user.id, name=cname, order=order, wip_limit=wip, is_default=True))
    default_categories = [
        ("academic", "Academic", "#4C6E5D"),
        ("career", "Career", "#8A6D3B"),
        ("personal", "Personal", "#5B6B8C"),
        ("health", "Health/Fitness", "#A14E4E"),
        ("other", "Other", "#6B6B6B"),
    ]
    for cid, cname, color in default_categories:
        session.add(models.Category(id=f"{cid}_{user.id}", user_id=user.id, name=cname, color=color, is_default=True))
    session.commit()

    return {"token": auth.create_token(user.id), "user": {"id": user.id, "email": user.email, "name": user.name}}


@app.post("/api/auth/login")
def login(body: dict, session: Session = Depends(get_session)):
    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""
    user = session.exec(select(models.User).where(models.User.email == email)).first()
    if not user or not auth.verify_password(password, user.password_hash):
        raise HTTPException(401, "Incorrect email or password")
    return {"token": auth.create_token(user.id), "user": {"id": user.id, "email": user.email, "name": user.name}}


@app.get("/api/auth/me")
def me(user: models.User = Depends(get_current_user)):
    return {"id": user.id, "email": user.email, "name": user.name}


# ---------------------------------------------------------------- Tasks --

@app.get("/api/tasks", response_model=list[models.Task])
def list_tasks(user: models.User = Depends(get_current_user), session: Session = Depends(get_session)):
    return session.exec(select(models.Task).where(models.Task.user_id == user.id)).all()


@app.post("/api/tasks", response_model=models.Task)
def create_task(task: models.Task, user: models.User = Depends(get_current_user), session: Session = Depends(get_session)):
    task.user_id = user.id
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


@app.put("/api/tasks/{task_id}", response_model=models.Task)
def update_task(task_id: str, patch: models.Task, user: models.User = Depends(get_current_user), session: Session = Depends(get_session)):
    existing = session.get(models.Task, task_id)
    if not existing or existing.user_id != user.id:
        raise HTTPException(404, "Task not found")
    data = patch.model_dump(exclude_unset=True, exclude={"user_id"})
    for key, value in data.items():
        setattr(existing, key, value)
    session.add(existing)
    session.commit()
    session.refresh(existing)
    return existing


@app.delete("/api/tasks/{task_id}")
def delete_task(task_id: str, user: models.User = Depends(get_current_user), session: Session = Depends(get_session)):
    existing = session.get(models.Task, task_id)
    if not existing or existing.user_id != user.id:
        raise HTTPException(404, "Task not found")
    session.delete(existing)
    session.commit()
    return {"ok": True}


# ---------------------------------------------------------------- Notes --

@app.get("/api/notes", response_model=list[models.StickyNote])
def list_notes(user: models.User = Depends(get_current_user), session: Session = Depends(get_session)):
    return session.exec(select(models.StickyNote).where(models.StickyNote.user_id == user.id)).all()


@app.post("/api/notes", response_model=models.StickyNote)
def create_note(note: models.StickyNote, user: models.User = Depends(get_current_user), session: Session = Depends(get_session)):
    note.user_id = user.id
    session.add(note)
    session.commit()
    session.refresh(note)
    return note


@app.put("/api/notes/{note_id}", response_model=models.StickyNote)
def update_note(note_id: str, patch: models.StickyNote, user: models.User = Depends(get_current_user), session: Session = Depends(get_session)):
    existing = session.get(models.StickyNote, note_id)
    if not existing or existing.user_id != user.id:
        raise HTTPException(404, "Note not found")
    data = patch.model_dump(exclude_unset=True, exclude={"user_id"})
    for key, value in data.items():
        setattr(existing, key, value)
    session.add(existing)
    session.commit()
    session.refresh(existing)
    return existing


@app.delete("/api/notes/{note_id}")
def delete_note(
    note_id: str,
    keep_linked_task: bool = True,
    user: models.User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    existing = session.get(models.StickyNote, note_id)
    if not existing or existing.user_id != user.id:
        raise HTTPException(404, "Note not found")
    if existing.linked_task_id and not keep_linked_task:
        task = session.get(models.Task, existing.linked_task_id)
        if task and task.user_id == user.id:
            task.linked_note_ids = [n for n in task.linked_note_ids if n != note_id]
            session.add(task)
    session.delete(existing)
    session.commit()
    return {"ok": True}


# ------------------------------------------------- Columns / categories --

@app.get("/api/columns", response_model=list[models.KanbanColumn])
def list_columns(user: models.User = Depends(get_current_user), session: Session = Depends(get_session)):
    return session.exec(select(models.KanbanColumn).where(models.KanbanColumn.user_id == user.id)).all()


@app.put("/api/columns", response_model=list[models.KanbanColumn])
def replace_columns(
    columns: list[models.KanbanColumn],
    user: models.User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    for existing in session.exec(select(models.KanbanColumn).where(models.KanbanColumn.user_id == user.id)).all():
        session.delete(existing)
    session.commit()
    for col in columns:
        col.user_id = user.id
        session.add(col)
    session.commit()
    return columns


@app.get("/api/categories", response_model=list[models.Category])
def list_categories(user: models.User = Depends(get_current_user), session: Session = Depends(get_session)):
    return session.exec(select(models.Category).where(models.Category.user_id == user.id)).all()


@app.post("/api/categories", response_model=models.Category)
def create_category(
    category: models.Category,
    user: models.User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    category.user_id = user.id
    session.add(category)
    session.commit()
    session.refresh(category)
    return category


@app.get("/api/tags", response_model=list[models.Tag])
def list_tags(user: models.User = Depends(get_current_user), session: Session = Depends(get_session)):
    return session.exec(select(models.Tag).where(models.Tag.user_id == user.id)).all()


@app.post("/api/tags", response_model=models.Tag)
def create_tag(tag: models.Tag, user: models.User = Depends(get_current_user), session: Session = Depends(get_session)):
    existing = session.exec(
        select(models.Tag).where(models.Tag.user_id == user.id, models.Tag.name == tag.name)
    ).first()
    if existing:
        return existing
    tag.user_id = user.id
    session.add(tag)
    session.commit()
    session.refresh(tag)
    return tag


# --------------------------------------------- Bulk state (import/sync) --

@app.get("/api/state")
def get_state(user: models.User = Depends(get_current_user), session: Session = Depends(get_session)):
    """Fetch everything for the logged-in account in one call."""
    return {
        "tasks": session.exec(select(models.Task).where(models.Task.user_id == user.id)).all(),
        "notes": session.exec(select(models.StickyNote).where(models.StickyNote.user_id == user.id)).all(),
        "columns": session.exec(select(models.KanbanColumn).where(models.KanbanColumn.user_id == user.id)).all(),
        "categories": session.exec(select(models.Category).where(models.Category.user_id == user.id)).all(),
        "tags": session.exec(select(models.Tag).where(models.Tag.user_id == user.id)).all(),
    }


@app.put("/api/state")
def replace_state(state: dict, user: models.User = Depends(get_current_user), session: Session = Depends(get_session)):
    """
    Replace everything for the logged-in account in one call — used by
    Settings > Cloud sync when the user chooses to push their local data
    up. Never called automatically; always an explicit user action.
    """
    table_map = {
        "tasks": models.Task,
        "notes": models.StickyNote,
        "columns": models.KanbanColumn,
        "categories": models.Category,
        "tags": models.Tag,
    }
    for key, Model in table_map.items():
        if key not in state:
            continue
        for existing in session.exec(select(Model).where(Model.user_id == user.id)).all():
            session.delete(existing)
        session.commit()
        for row in state[key]:
            row.pop("user_id", None)
            session.add(Model(user_id=user.id, **row))
        session.commit()
    return {"ok": True}
