from fastapi import FastAPI
from mission_gen_api import router as mission_router

app = FastAPI()

# include mission routes
app.include_router(mission_router)
