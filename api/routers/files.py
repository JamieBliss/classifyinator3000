from ..services.file_services import file_reader_factory
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, BackgroundTasks
from ..services.file_services import process_file
from sqlmodel import Session

from ..database import get_session
from ..models.file_model import FileRecord, FileRecordWithClassifications

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
    db: Session = Depends(get_session),
    background_tasks: BackgroundTasks = BackgroundTasks(),
):
    try:
        file_contents = await file_reader_factory(file.filename).read(file)
        file_record = FileRecord(filename=file.filename, file_contents=file_contents)
        db.add(file_record)
        db.commit()
        db.refresh(file_record)
        background_tasks.add_task(process_file, file_record.id, db)
        return {
            "id": file_record.id,
            "status": file_record.status,
            "message": "File uploaded successfully!",
        }
    except Exception as e:
        return HTTPException(status_code=500, detail=str(e))
    finally:
        await file.close()


@router.get("/status/{file_id}")
def check_file_status(file_id: int, db: Session = Depends(get_session)):
    file = db.get(FileRecord, file_id)
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    return {"status": file.status}
