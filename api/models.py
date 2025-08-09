from datetime import datetime, timezone
from typing import Optional
from enum import Enum

from sqlmodel import Field, SQLModel


class FileStatus(str, Enum):
    processing = "Processing"
    completed = "Completed"
    failed = "Failed"


class FileRecord(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    filename: str
    file_contents: str
    status: FileStatus = Field(default=FileStatus.processing)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc), nullable=False
    )


class ClassificationLabel(str, Enum):
    technical_documentation = "Technical Documentation"
    business_proposal = "Business Proposal"
    legal_document = "Legal Document"
    academic_paper = "Academic Paper"
    general_article = "General Article"
    other = "Other"


class FileClassification(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    file_id: Optional[int] = Field(default=None, foreign_key="filerecord.id")
    classification: ClassificationLabel
    classification_score: float
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc), nullable=False
    )
