from functools import lru_cache
import torch
from transformers import pipeline, AutoTokenizer
from sentence_transformers import SentenceTransformer


def get_device():
    if torch.cuda.is_available():
        return "cuda:0"
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
    return SentenceTransformer(model_name)
