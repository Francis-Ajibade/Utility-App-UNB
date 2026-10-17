from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import invites, me, teams

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.web_origin],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(me.router)
app.include_router(teams.router)
app.include_router(invites.router)


@app.get("/health")
async def health():
    return {"ok": True}
