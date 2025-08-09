from typing import Annotated
from fastapi import FastAPI, Depends
from sqlmodel import Session

from .database import create_db_and_tables, get_session
from .routers import files as file_routes

SessionDep = Annotated[Session, Depends(get_session)]

app = FastAPI()
app.include_router(file_routes.router)


@app.on_event("startup")
def on_startup():
    create_db_and_tables()
