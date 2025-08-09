from abc import abstractmethod
from datetime import datetime, timezone
from pathlib import Path
import time

from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from sqlmodel import Session

from ..database import get_session
from ..models import FileRecord

router = APIRouter(
    prefix="/files",
    tags=["files"],
)


class FileProcessorInterface:
    @abstractmethod
    def read(self, file: File) -> str:
        pass


class TextFileProcessor(FileProcessorInterface):
    def read(self, file: File) -> str:
        return file.read().decode("utf-8")


class PDFProcessor(FileProcessorInterface):
    def read(self, file: File) -> str:
        # Placeholder for PDF processing logic
        return f"Contents of PDF file: {file.filename}"


class WordProcessor(FileProcessorInterface):
    def read(self, file: File) -> str:
        # Placeholder for Word processing
        return f"Contents of Word file: {file.filename}"


def file_processor_factory(file_type: str) -> FileProcessorInterface:
    if file_type == "text":
        return TextFileProcessor()
    # elif file_type == "pdf":
    #     return PDFProcessor()
    # elif file_type == "word":
    #     return WordProcessor()
    else:
        raise ValueError(f"Unsupported file type: {file_type}")


@router.post("/upload", response_model=FileRecord)
async def upload_file(file: UploadFile = File(...), db: Session = Depends(get_session)):
    try:
        file_contents = file_processor_factory(file.content_type).read(file)
        file_record = FileRecord(filename=file.filename, file_contents=file_contents)
        db.add(file_record)
        db.commit()
        db.refresh(file_record)
        return file_record
    finally:
        await file.close()


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


@router.get("/status/{file_id}")
def check_file_status(file_id: int, db: Session = Depends(get_session)):
    file = db.get(FileRecord, file_id)
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    return {"status": file.status}
