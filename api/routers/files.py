from datetime import datetime, timezone
from typing import Optional
from ..services.file_services import file_reader_factory
from fastapi import (
    APIRouter,
    Depends,
    File,
    UploadFile,
    HTTPException,
    BackgroundTasks,
    Body,
)
from ..services.file_services import process_file
from sqlmodel import Session, select
from pydantic import BaseModel
import magic

from ..database import get_session
from ..models.file_model import (
    ChunkingStrategy,
    FileClassificationChunk,
    FileClassification,
    FileClassificationScore,
    FileRecord,
    FileRecordWithClassifications,
    FileStatus,
)
import logging

router = APIRouter(
    prefix="/files",
    tags=["files"],
)

logger = logging.getLogger("classifyinator")


@router.get("/list", response_model=list[FileRecordWithClassifications])
def list_files(db: Session = Depends(get_session)):
    files = db.query(FileRecord).all()
    return files


class ProcessFileRequest(BaseModel):
    file_id: int
    chunking_strategy: ChunkingStrategy
    chunk_size: Optional[int] = None
    overlap: Optional[int] = None
    multi_label: bool = False


@router.post("/process", response_model=FileRecord)
async def process_file_request(
    file_details: ProcessFileRequest = Body(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_session),
):
    if file_details.chunking_strategy != ChunkingStrategy.paragraph:
        if file_details.chunk_size <= file_details.overlap - 1:
            raise HTTPException(
                status_code=400,
                detail="Chunk size must be greater than overlap",
            )

    # If it is called with the same params as before we will delete it
    statement = select(FileClassification).where(
        FileClassification.file_id == file_details.file_id,
        FileClassification.chunking_strategy == file_details.chunking_strategy,
        FileClassification.chunk_size == file_details.chunk_size,
        FileClassification.chunk_overlap_size == file_details.overlap,
        FileClassification.multi_label == file_details.multi_label,
    )
    classifications = db.exec(statement).all()
    for classification in classifications:
        db.delete(classification)
    file_record = db.get(FileRecord, file_details.file_id)
    file_record.status = FileStatus.processing
    db.add(file_record)
    db.commit()
    background_tasks.add_task(
        process_file,
        file_details.file_id,
        file_details.chunking_strategy,
        file_details.chunk_size,
        file_details.overlap,
        file_details.multi_label,
        db,
        logger,
    )

    return {"id": file_details.file_id, "status": FileStatus.processing}


ALLOWED_MIME_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
]


async def check_file(file: File):
    client_mime = file.content_type

    file_bytes = await file.read(2048)
    await file.seek(0)
    real_mime = magic.from_buffer(file_bytes, mime=True)
    if real_mime not in ALLOWED_MIME_TYPES:
        return False, f"Invalid file type {real_mime}"

    if client_mime != real_mime:
        return (
            False,
            f"MIME mismatch: client said {client_mime}, but real type is {real_mime}",
        )

    return True, None


@router.post("/upload", response_model=FileRecord)
async def upload_file(
    file: UploadFile = File(...),
    override: bool = False,
    db: Session = Depends(get_session),
    background_tasks: BackgroundTasks = BackgroundTasks(),
):
    # check if file exists in db
    statement = select(FileRecord).where(FileRecord.filename == file.filename)
    file_record = db.exec(statement).first()

    if not override and file_record:
        raise HTTPException(
            status_code=409,
            detail=f"File '{file.filename}' already exists - retry with override flag set to true to re-upload and process the file again.",
        )
    is_file_safe, err = await check_file(file)
    if not is_file_safe:
        raise HTTPException(status_code=400, detail=err)
    try:
        file_contents = await file_reader_factory(file.filename).read(file)
        if not file_record:
            file_record = FileRecord(
                filename=file.filename, file_contents=file_contents
            )
            db.add(file_record)
        else:
            file_record.file_contents = file_contents
            file_record.status = FileStatus.processing
            file_record.updated_at = datetime.now(timezone.utc)
            db.add(file_record)
            statement = select(FileClassification).where(
                FileClassification.file_id == file_record.id
            )
            file_classifications = db.exec(statement).all()
            for file_classification in file_classifications:
                db.delete(file_classification)

        db.commit()
        db.refresh(file_record)
        background_tasks.add_task(
            process_file,
            file_record.id,
            ChunkingStrategy.paragraph,
            None,
            None,
            False,
            db,
            logger,
        )
        return {
            "id": file_record.id,
            "status": file_record.status,
            "message": "File uploaded successfully!",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await file.close()


@router.get("/status/{file_id}")
def check_file_status(file_id: int, db: Session = Depends(get_session)):
    file = db.get(FileRecord, file_id)
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    if file.status == FileStatus.failed:
        return {
            "status": file.status,
            "message": "File processing failed, please check your file is not corrupted and try again",
        }
    return {"status": file.status}


@router.delete("/delete/{file_id}")
def delete_file(file_id: int, db: Session = Depends(get_session)):
    statement = select(FileRecord).where(FileRecord.id == file_id)
    file_id_exists = db.exec(statement).first()
    if not file_id_exists:
        return HTTPException(status_code=404, detail="File not found")

    statement = select(FileClassification).where(FileClassification.file_id == file_id)
    file_classifications = db.exec(statement).all()

    statement = select(FileClassificationChunk).where(
        FileClassificationChunk.file_classification_id.in_(
            [file_classification.id for file_classification in file_classifications]
        )
    )
    file_classification_chunk = db.exec(statement).all()
    for file_chunk_classification in file_classification_chunk:
        db.delete(file_chunk_classification)

    statement = select(FileClassificationScore).where(
        FileClassificationScore.file_classification_id.in_(
            [file_classification.id for file_classification in file_classifications]
        )
    )
    file_classification_scores = db.exec(statement).all()
    for file_classification_score in file_classification_scores:
        db.delete(file_classification_score)

    for file_classification in file_classifications:
        db.delete(file_classification)
    statement = select(FileRecord).where(FileRecord.id == file_id)
    db.delete(db.exec(statement).first())
    db.commit()
    return {"message": "File deleted successfully"}
