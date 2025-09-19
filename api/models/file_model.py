from datetime import datetime, timezone
from typing import Optional
from enum import Enum
from sqlmodel import Field, SQLModel, Relationship
from typing import List


class FileStatus(str, Enum):
    processing = "Processing"
    completed = "Completed"
    failed = "Failed"


class Models(str, Enum):
    bart_large_mnli = "facebook/bart-large-mnli"
    comprehend_it_base = "knowledgator/comprehend_it-base"
    qwen_embedding = "Qwen/Qwen3-Embedding-0.6B"
    e5_large = "intfloat/multilingual-e5-large-instruct"


class FileRecord(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    filename: str
    file_contents: str
    status: FileStatus = Field(default=FileStatus.processing)
    classifications: List["FileClassification"] = Relationship(back_populates="file")
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


class ChunkingStrategy(str, Enum):
    number = "Number"
    paragraph = "Paragraph"
    sentence = "Sentence"


class FileClassification(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    file_id: Optional[int] = Field(default=None, foreign_key="filerecord.id")
    model: str
    multi_label: bool = Field(default=False)
    chunking_strategy: Optional[ChunkingStrategy] = None
    chunk_size: Optional[int] = None
    chunk_overlap_size: Optional[int] = None
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc), nullable=False
    )
    file: Optional[FileRecord] = Relationship(back_populates="classifications")
    file_classification_scores: List["FileClassificationScore"] = Relationship(
        back_populates="file_classification",
        sa_relationship_kwargs={"cascade": "all, delete, delete-orphan"}
    )
    file_classification_chunks: List["FileClassificationChunk"] = Relationship(
        back_populates="file_classification",
        sa_relationship_kwargs={"cascade": "all, delete, delete-orphan"}
    )


class FileClassificationScore(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    file_classification_id: Optional[int] = Field(
        default=None, foreign_key="fileclassification.id"
    )
    classification_score: float
    classification: ClassificationLabel
    file_classification: Optional[FileClassification] = Relationship(
        back_populates="file_classification_scores"
    )


class FileClassificationChunk(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    file_classification_id: Optional[int] = Field(
        default=None, foreign_key="fileclassification.id"
    )
    start: int
    end: int
    chunk: str
    chunk_classification_label: ClassificationLabel
    chunk_classification_score: float
    file_classification: Optional[FileClassification] = Relationship(
        back_populates="file_classification_chunks"
    )


class FileClassificationWithScoresAndChunks(SQLModel):
    id: int
    file_id: int
    model: str
    multi_label: bool
    chunking_strategy: ChunkingStrategy
    chunk_size: Optional[int]
    chunk_overlap_size: Optional[int]
    created_at: datetime
    file_classification_scores: List[FileClassificationScore] = Field(default_factory=list)
    file_classification_chunks: List[FileClassificationChunk] = Field(default_factory=list)


class FileRecordWithClassifications(SQLModel):
    id: int
    filename: str
    # file_contents: str
    status: FileStatus
    created_at: datetime
    updated_at: datetime
    classifications: List[FileClassificationWithScoresAndChunks] = Field(default_factory=list)
