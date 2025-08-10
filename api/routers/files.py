from datetime import datetime, timezone
from ..services.file_services import file_reader_factory
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, BackgroundTasks
from ..services.file_services import process_file
from sqlmodel import Session

from ..database import get_session
from ..models.file_model import (
    FileClassification,
    FileRecord,
    FileRecordWithClassifications,
    FileStatus,
)

router = APIRouter(
    prefix="/files",
    tags=["files"],
)


@router.get("/list", response_model=list[FileRecordWithClassifications])
def list_files(db: Session = Depends(get_session)):
    files = db.query(FileRecord).all()
    for file in files:
        file.classifications.sort(key=lambda x: x.classification_score, reverse=True)
    return files


@router.post("/upload", response_model=FileRecord)
async def upload_file(
    file: UploadFile = File(...),
    override: bool = False,
    db: Session = Depends(get_session),
    background_tasks: BackgroundTasks = BackgroundTasks(),
):
    # check if file exists in db
    file_record = (
        db.query(FileRecord).filter(FileRecord.filename == file.filename).first()
    )
    if not override and file_record:
        raise HTTPException(
            status_code=409,
            detail=f"File '{file.filename}' already exists - retry with override flag set to true to re-upload and process the file again.",
        )

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
            file_classifications = db.query(FileClassification).filter(
                FileClassification.file_id == file_record.id
            )
            for file_classification in file_classifications:
                db.delete(file_classification)

        db.commit()
        db.refresh(file_record)
        background_tasks.add_task(process_file, file_record.id, db)
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
    db.delete(db.get(FileRecord, file_id))
    db.commit()
    return {"message": "File deleted successfully"}
