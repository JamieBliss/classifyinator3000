from abc import abstractmethod
from datetime import datetime, timezone
import io

import numpy as np
import PyPDF2
from docx import Document
from transformers import pipeline
from sqlmodel import Session

from ..models.file_model import (
    ChunkingStrategy,
    ClassificationLabel,
    FileClassification,
    FileRecord,
)
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
        # Read the entire file content into an in-memory bytes buffer
        pdf_contents = await file.read()
        pdf_stream = io.BytesIO(pdf_contents)

        pdf_reader = PyPDF2.PdfReader(pdf_stream)

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
        word_contents = await file.read()
        word_stream = io.BytesIO(word_contents)

        word_reader = Document(word_stream)
        text_content = ""
        for paragraph in word_reader.paragraphs:
            if paragraph.text:
                text_content += paragraph.text + "\n"

        return text_content.strip()


def file_reader_factory(file_name: str) -> FileReaderInterface:
    file_type = file_name.split(".")[-1].lower()
    if file_type == "txt":
        return TextFileReader()
    elif file_type == "pdf":
        return PDFReader()
    elif file_type == "docx":
        return WordReader()
    else:
        raise ValueError(f"Unsupported file type: {file_type}")


MODELS = [
    "facebook/bart-large-mnli",
    "MoritzLaurer/DeBERTa-v3-large-mnli-fever-anli-ling-wanli",
    "knowledgator/comprehend_it-base",
]


def get_classifier(multi_label: bool = False):
    return pipeline(
        "zero-shot-classification",
        model=MODELS[0],
        multi_label=multi_label,
    )


def chunk_text(
    text: str,
    chunking_strategy: ChunkingStrategy,
    chunk_size: int = 200,
    overlap: int = 50,
) -> list[str]:
    if chunking_strategy == ChunkingStrategy.paragraph:
        return text.split("\n\n")

    if chunking_strategy == ChunkingStrategy.sentence:
        return text.split(". ")

    if chunk_size <= overlap:
        raise ValueError("Chunk size must be greater than overlap")

    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk = words[i : i + chunk_size]
        chunks.append(" ".join(chunk))
        i += chunk_size - overlap
    return chunks


def process_file(
    file_id: int,
    chunking_strategy: ChunkingStrategy,
    chunk_size: int,
    overlap: int,
    multi_label: bool = False,
    db: Session = Depends(get_session),
):
    file = db.get(FileRecord, file_id)
    if not file:
        return
    try:
        chunked_sequence = chunk_text(
            file.file_contents, chunking_strategy, chunk_size, overlap
        )
        candidate_labels = [label.value for label in ClassificationLabel]
        results = {label: [] for label in candidate_labels}
        weights = {label: [] for label in candidate_labels}
        classifier = get_classifier(multi_label)
        for chunk in chunked_sequence:
            result = classifier(chunk, candidate_labels)
            for label, score in zip(result["labels"], result["scores"]):
                results[label].append(score)
                weights[label].append(len(chunk.split()))

        for label in candidate_labels:
            score = np.average(results[label], weights=weights[label])
            db.add(
                FileClassification(
                    file_id=file.id,
                    classification=label,
                    classification_score=score,
                    multi_label=multi_label,
                    chunking_strategy=chunking_strategy,
                    chunk_size=chunk_size,
                    chunk_overlap_size=overlap,
                )
            )
        file.status = "completed"
    except Exception:
        file.status = "failed"
    finally:
        file.updated_at = datetime.now(timezone.utc)
        db.add(file)
        db.commit()
