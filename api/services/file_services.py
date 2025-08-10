from abc import abstractmethod
from datetime import datetime, timezone

import numpy as np
import PyPDF2
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
        pdf_reader = PyPDF2.PdfReader(file)

        # Initialize empty string to store text
        text_content = ""

        # Iterate through all pages
        for page in pdf_reader.pages:
            # Extract text from page and append to content
            page_text = page.extract_text()
            if page_text:
                text_content += page_text + "\n"

        return text_content.strip()


class WordReader(FileReaderInterface):
    async def read(self, file: File) -> str:
        # Placeholder for Word processing
        return f"Contents of Word file: {file.filename}"


def file_reader_factory(file_name: str) -> FileReaderInterface:
    file_type = file_name.split(".")[-1].lower()
    if file_type == "txt":
        return TextFileReader()
    elif file_type == "pdf":
        return PDFReader()
    # elif file_type == "word":
    #     return WordReader()
    else:
        raise ValueError(f"Unsupported file type: {file_type}")


classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")


def chunk_text(text: str, chunk_size: int = 200, overlap: int = 50) -> list[str]:
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk = words[i : i + chunk_size]
        chunks.append(" ".join(chunk))
        i += chunk_size - overlap
    return chunks


def process_file(file_id: int, db: Session = Depends(get_session)):
    file = db.get(FileRecord, file_id)
    if not file:
        return
    try:
        chunked_sequence = chunk_text(file.file_contents)
        candidate_labels = [label.value for label in ClassificationLabel]
        results = {label: [] for label in candidate_labels}
        weights = {label: [] for label in candidate_labels}

        for chunk in chunked_sequence:
            result = classifier(chunk, candidate_labels)
            for label, score in zip(result["labels"], result["scores"]):
                results[label].append(score)
                weights[label].append(len(chunk.split()) * score)

        for label in candidate_labels:
            score = np.average(results[label], weights=weights[label])
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
