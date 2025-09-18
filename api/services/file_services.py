from abc import abstractmethod
from datetime import datetime, timezone
import io
import re
from typing import Dict, List
from celery.utils.log import get_task_logger
from ..celery_app import celery_app, get_model_pipeline, get_embed_model, get_tokenizer
import numpy as np
import PyPDF2
from docx import Document
from sqlmodel import Session

from ..models.file_model import (
    ChunkingStrategy,
    ClassificationLabel,
    FileClassificationChunk,
    FileClassificationScore,
    FileClassification,
    FileRecord,
)
from fastapi import File
from ..database import engine

task_logger = get_task_logger(__name__)


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


def chunk_text(text: str):
    # basic implementation but allows easy improvements for headings and lists
    chunks = []
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    paragraphs = re.split(r"\n\s*\n+", text.strip())
    offset = 0
    for paragraph in paragraphs:
        if paragraph.strip():
            chunks.append(
                {
                    "text": paragraph.strip(),
                    "start": offset,
                    "end": offset + len(paragraph),
                    "token_count": None,
                }
            )
            offset += len(paragraph)

    return chunks


def group_similar_chunks(chunks: List[Dict], similarity_threshold: float = 0.85):
    text = [chunk["text"] for chunk in chunks]
    embeddings = get_embed_model().encode(text, normalize_embeddings=True)

    grouped_chunks = []
    i = 0
    while i < len(chunks):
        current = chunks[i]
        current_embedding = embeddings[i]
        j = i + 1
        while j < len(chunks):
            # because we normalised earlier we dont need to run cosine sim
            sim = float(np.dot(current_embedding, embeddings[j]))
            if sim > similarity_threshold:
                current["text"] += "\n" + chunks[j]["text"]
                current["end"] = chunks[j]["end"]
                current_embedding = current_embedding + embeddings[j]
                current_embedding = current_embedding / np.linalg.norm(
                    current_embedding
                )
                j += 1
            else:
                break
        grouped_chunks.append(current)
        i = j
    return grouped_chunks


def split_large_paragraph(model_name: str, paragraph: str, max_tokens: int):
    """Split a paragraph into subchunks under max_tokens."""
    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", paragraph) if s.strip()]
    chunks, current = [], []

    for sent in sentences:
        candidate = " ".join(current + [sent]).strip()
        if count_tokens(model_name, candidate) > max_tokens:
            if current:
                chunks.append(" ".join(current).strip())
                current = [sent]
            else:
                # sentence itself too long -> split by words
                words = sent.split()
                subcurrent = []
                for w in words:
                    subcandidate = " ".join(subcurrent + [w])
                    if count_tokens(model_name, subcandidate) > max_tokens:
                        chunks.append(" ".join(subcurrent))
                        subcurrent = [w]
                    else:
                        subcurrent.append(w)
                if subcurrent:
                    chunks.append(" ".join(subcurrent))
                current = []
        else:
            current.append(sent)

    if current:
        chunks.append(" ".join(current).strip())
    return chunks


def count_tokens(model_name: str, text: str):
    return len(get_tokenizer(model_name).encode(text, add_special_tokens=False))


def chunk_by_token(model_name: str, chunk: Dict, chunk_size=500) -> List[Dict]:
    # Need to think about overlap and when to do it
    token_count = count_tokens(model_name, chunk["text"])
    if token_count <= chunk_size:
        return [{**chunk, "token_count": token_count}]

    # otherwise split into sentences
    sentences = [
        s.strip() for s in re.split(r"(?<=[.!?])\s+", chunk["text"]) if s.strip()
    ]

    # Start & End data is being lost
    chunks, current = [], []
    for sentence in sentences:
        candidate = " ".join(current + [sentence]).strip()
        if count_tokens(model_name, candidate) > chunk_size:
            if current:
                chunks.append(
                    {
                        "text": " ".join(current).strip(),
                        "token_count": count_tokens(
                            model_name, " ".join(current).strip()
                        ),
                    }
                )
                current = [sentence]
            else:
                # sentence itself too long -> split by words
                words = sentence.split()
                word_current = []
                for word in words:
                    subcandidate = " ".join(word_current + [word])
                    if count_tokens(model_name, subcandidate) > chunk_size:
                        chunks.append(
                            {
                                "text": " ".join(word_current).strip(),
                                "token_count": count_tokens(
                                    model_name, " ".join(word_current).strip()
                                ),
                            }
                        )
                        word_current = [word]
                    else:
                        word_current.append(word)
                if word_current:
                    chunks.append(
                        {
                            "text": " ".join(word_current).strip(),
                            "token_count": count_tokens(
                                model_name, " ".join(word_current).strip()
                            ),
                        }
                    )
                current = []
        else:
            current.append(sentence)

    if current:
        chunks.append(
            {
                "text": " ".join(current).strip(),
                "token_count": count_tokens(model_name, " ".join(current).strip()),
            }
        )
    return chunks

@celery_app.task
def process_file(
    file_id: int,
    model: str,
    chunking_strategy: ChunkingStrategy,
    chunk_size: int,
    overlap: int,
    multi_label: bool = False,
):
    with Session(engine) as db:
        file = db.get(FileRecord, file_id)
        if not file:
            task_logger.error(f"File with id {file_id} not found for processing.")
            return
        try:
            chunks = chunk_text(file.file_contents)
            grouped_chunks = group_similar_chunks(chunks)
            chunks_by_token = []
            for chunk in grouped_chunks:
                chunks_by_token.extend(chunk_by_token(model, chunk))
            candidate_labels = [label.value for label in ClassificationLabel]
            results = {label: [] for label in candidate_labels}
            weights = {label: [] for label in candidate_labels}
            for chunk in chunks_by_token:
                result = get_model_pipeline(model)(chunk["text"], candidate_labels)
                max_chunk_classification = {
                    "label": result["labels"][0],
                    "score": result["scores"][0],
                }
                for label, score in zip(result["labels"], result["scores"]):
                    if score > max_chunk_classification["score"]:
                        max_chunk_classification = {"label": label, "score": score}
                    results[label].append(score)
                    weights[label].append(len(chunk["text"].split()))
                chunk["chunk_classification"] = max_chunk_classification

            file_classification = FileClassification(
                file_id=file.id,
                model=model,
                multi_label=multi_label,
                chunking_strategy=chunking_strategy,
                chunk_size=chunk_size,
                chunk_overlap_size=overlap,
            )
            db.add(file_classification)
            db.commit()
            db.refresh(file_classification)

            for label in candidate_labels:
                score = np.average(results[label], weights=weights[label])

                score_obj = FileClassificationScore(
                    file_classification_id=file_classification.id,
                    classification=label,
                    classification_score=score,
                )
                db.add(score_obj)

            for chunk in chunks_by_token:
                chunk_obj = FileClassificationChunk(
                    file_classification_id=file_classification.id,
                    start=chunk.get("start", 0),
                    end=chunk.get("end", 0),
                    chunk=chunk["text"],
                    chunk_classification_score=chunk["chunk_classification"]["score"],
                    chunk_classification_label=chunk["chunk_classification"]["label"],
                )
                db.add(chunk_obj)

            file.status = "completed"
            file.updated_at = datetime.now(timezone.utc)
            db.add(file)
            db.commit()
        except Exception as err:
            db.rollback()
            task_logger.exception(err)
            file_to_fail = db.get(FileRecord, file_id)
            if file_to_fail:
                file_to_fail.status = "failed"
                file_to_fail.updated_at = datetime.now(timezone.utc)
                db.add(file_to_fail)
                db.commit()
