from abc import abstractmethod
from datetime import datetime, timezone
from transformers import pipeline
from sqlmodel import Session

from ..models.file_model import ClassificationLabel, FileClassification, FileRecord
from fastapi import Depends, File
from ..database import get_session


class FileReaderInterface:
    @abstractmethod
    async def read(self, file: File) -> str:
        pass


class TextFileReader(FileReaderInterface):
    async def read(self, file: File) -> str:
        contents = await file.read()
        return contents.decode("utf-8")


class PDFReader(FileReaderInterface):
    async def read(self, file: File) -> str:
        # Placeholder for PDF processing logic
        return f"Contents of PDF file: {file.filename}"


class WordReader(FileReaderInterface):
    async def read(self, file: File) -> str:
        # Placeholder for Word processing
        return f"Contents of Word file: {file.filename}"


def file_reader_factory(file_name: str) -> FileReaderInterface:
    file_type = file_name.split(".")[-1].lower()
    if file_type == "txt":
        return TextFileReader()
    # elif file_type == "pdf":
    #     return PDFReader()
    # elif file_type == "word":
    #     return WordReader()
    else:
        raise ValueError(f"Unsupported file type: {file_type}")


classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")


def process_file(file_id: int, db: Session = Depends(get_session)):
    file = db.get(FileRecord, file_id)
    if not file:
        return
    try:
        sequence_to_classify = file.file_contents
        candidate_labels = [label.value for label in ClassificationLabel]
        result = classifier(sequence_to_classify, candidate_labels)
        for label, score in zip(result["labels"], result["scores"]):
            db.add(
                FileClassification(
                    file_id=file.id,
                    classification=label,
                    classification_score=score,
                )
            )
        file.status = "completed"
    except Exception:
        file.status = "failed"
    finally:
        file.updated_at = datetime.now(timezone.utc)
        db.add(file)
        db.commit()
