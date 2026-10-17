from fastapi import APIRouter, Depends
from pydantic import BaseModel
from supabase import PostgrestAPIError

from app.auth import CurrentUser, get_current_user
from app.errors import to_http
from app.services import invites, teams
from app.services.invites import InviteLink
from app.services.profiles import TeamSummary

router = APIRouter(prefix="/teams", tags=["teams"])


class CreateTeamBody(BaseModel):
    name: str


# 201 = "created", the usual status for a POST that makes something new
@router.post("", response_model=TeamSummary, status_code=201)
async def create_team(body: CreateTeamBody, user: CurrentUser = Depends(get_current_user)):
    return await teams.create_team(user.client, body.name)


@router.post("/{team_id}/invite-link", response_model=InviteLink, status_code=201)
async def create_invite_link(team_id: str, user: CurrentUser = Depends(get_current_user)):
    try:
        return await invites.create_link(user.client, team_id)
    except PostgrestAPIError as error:
        raise to_http(error)
