"""
Database models for Scribmind's optional sync backend.

These mirror the TypeScript types in src/lib/types.ts. Nested/structured
data (rich text JSON, checklists, handwriting strokes) is stored as JSON
columns rather than being normalized into extra tables — it is only ever
read/written as a whole document by the frontend editor, so normalizing it
would add joins without adding real query power.
"""

from typing import Optional
from sqlalchemy import Column, JSON
from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
    id: str = Field(primary_key=True)
    email: str = Field(unique=True, index=True)
    password_hash: str
    name: str
    created_at: str


class Task(SQLModel, table=True):
    id: str = Field(primary_key=True)
    user_id: Optional[str] = Field(default=None, index=True)
    title: str
    description: str = ""
    status: str = "backlog"
    order: int = 0
    category_id: str = "other"
    priority: str = "medium"
    due_date: Optional[str] = None
    start_date: Optional[str] = None
    tag_ids: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    checklist: list[dict] = Field(default_factory=list, sa_column=Column(JSON))
    notes: str = ""
    attachments: list[dict] = Field(default_factory=list, sa_column=Column(JSON))
    recurrence: str = "none"
    reminder: Optional[str] = None
    linked_note_ids: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    created_at: str
    updated_at: str
    completed_at: Optional[str] = None


class StickyNote(SQLModel, table=True):
    id: str = Field(primary_key=True)
    user_id: Optional[str] = Field(default=None, index=True)
    title: str = ""
    rich_content: dict = Field(default_factory=dict, sa_column=Column(JSON))
    strokes: list[dict] = Field(default_factory=list, sa_column=Column(JSON))
    draw_height: int = 0
    x: float = 0
    y: float = 0
    width: float = 260
    height: float = 220
    z_index: int = 1
    color: str = "#F5E6A8"
    pinned: bool = False
    pinned_to_desktop: bool = False
    linked_task_id: Optional[str] = None
    created_at: str
    updated_at: str


class KanbanColumn(SQLModel, table=True):
    id: str = Field(primary_key=True)
    user_id: Optional[str] = Field(default=None, index=True)
    name: str
    order: int = 0
    wip_limit: Optional[int] = None
    is_default: bool = False


class Category(SQLModel, table=True):
    id: str = Field(primary_key=True)
    user_id: Optional[str] = Field(default=None, index=True)
    name: str
    color: str
    is_default: bool = False


class Tag(SQLModel, table=True):
    id: str = Field(primary_key=True)
    user_id: Optional[str] = Field(default=None, index=True)
    name: str
