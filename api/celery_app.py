from celery import Celery
from celery.signals import worker_process_init

import torch
from functools import lru_cache
from api.models.file_model import Models
from api.database import create_db_and_tables
from transformers import pipeline, AutoTokenizer
from sentence_transformers import SentenceTransformer


celery_app = Celery(
    "tasks", broker="redis://localhost:6379/0", backend="redis://localhost:6379/0"
)
celery_app.autodiscover_tasks(["api.services.file_services"])

def get_device():
    if torch.cuda.is_available():
        return "cuda"
    else:
        return "cpu"


@lru_cache(maxsize=3)
def get_model_pipeline(model_name):
    print(f"Loading model {model_name}")
    device = get_device()
    print(f"Using device {device}")
    return pipeline("zero-shot-classification", model=model_name, device=device)


@lru_cache(maxsize=3)
def get_tokenizer(model_name):
    return AutoTokenizer.from_pretrained(model_name, use_fast=True)


@lru_cache(maxsize=1)
def get_embed_model(model_name="all-MiniLM-L6-v2"):
    device = get_device()
    return SentenceTransformer(model_name, device=device)


@celery_app.on_after_finalize.connect
def preload_models_for_worker(**kwargs):
    print("Preloading models for Celery worker...")
    # Preload the embedding model
    get_embed_model()
    # Preload the classification models and their tokenizers
    for model in Models:
        get_model_pipeline(model.value)
        get_tokenizer(model.value)
    print("Models preloaded successfully for Celery worker.")