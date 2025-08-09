from abc import abstractmethod
from datetime import datetime, timezone
import time

from sqlmodel import Session

from ..models.file_model import FileRecord
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


def process_file(file_id: int, db: Session = Depends(get_session)):
    file = db.get(FileRecord, file_id)
    if not file:
        return
    try:
        time.sleep(20)
        file.status = "completed"
    except Exception:
        file.status = "failed"
    finally:
        file.updated_at = datetime.now(timezone.utc)
        db.add(file)
        db.commit()
