from datetime import datetime

from pydantic import BaseModel
from supabase import AsyncClient

from app.services.profiles import TeamSummary, list_my_teams


# Same shape as InviteLink in web/src/lib/api.ts
class InviteLink(BaseModel):
    token: str
    expires_at: datetime


async def create_link(client: AsyncClient, team_id: str) -> InviteLink:
    # The database function checks the caller is an admin and cancels the old link.
    response = await client.rpc("create_invite_link", {"p_team_id": team_id}).execute()
    # It returns a table, so data is a list with one row
    return InviteLink(**response.data[0])


async def join(client: AsyncClient, token: str) -> TeamSummary | None:
    # The database function checks the link and adds the caller as a member.
    response = await client.rpc("join_team", {"p_token": token}).execute()
    team_id = response.data

    teams = await list_my_teams(client)
    return next((t for t in teams if t.id == team_id), None)
