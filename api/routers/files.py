from ..services.file_services import file_reader_factory
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from sqlmodel import Session

from ..database import get_session
from ..models.file_model import FileRecord

router = APIRouter(
    prefix="/files",
    tags=["files"],
)


@router.post("/upload", response_model=FileRecord)
async def upload_file(file: UploadFile = File(...), db: Session = Depends(get_session)):
    try:
        file_contents = await file_reader_factory(file.filename).read(file)
        file_record = FileRecord(filename=file.filename, file_contents=file_contents)
        db.add(file_record)
        db.commit()
        db.refresh(file_record)
        return {
            "id": file_record.id,
            "status": file_record.status,
            "message": "File uploaded successfully!",
        }
    finally:
        await file.close()


@router.get("/status/{file_id}")
def check_file_status(file_id: int, db: Session = Depends(get_session)):
    file = db.get(FileRecord, file_id)
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    return {"status": file.status}
