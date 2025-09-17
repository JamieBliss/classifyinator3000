from typing import Annotated
from api.models.file_model import Models
from api.models_cache import get_embed_model, get_model_pipeline, get_tokenizer
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session
from .celery_app import celery_app
from .database import create_db_and_tables, get_session
from .routers import files as file_routes

SessionDep = Annotated[Session, Depends(get_session)]

origins = [
    "http://localhost:3000",
]

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(file_routes.router)


@celery_app.task
def preload_models():
    for model in Models:
        get_model_pipeline(model.value)


@celery_app.task
def preload_embed_model():
    get_embed_model()


@celery_app.task
def preload_tokenizer():
    for model in Models:
        get_tokenizer(model.value)


@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    preload_models.delay()
    preload_embed_model.delay()
    preload_tokenizer.delay()
