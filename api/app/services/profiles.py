from pydantic import BaseModel
from supabase import AsyncClient


class TeamSummary(BaseModel):
    id: str
    name: str
    role: str


class MeResponse(BaseModel):
    id: str
    email: str
    display_name: str | None
    teams: list[TeamSummary] = []


# Each function takes the user's client, so RLS applies to every query.

async def get_profile(client: AsyncClient, user_id: str) -> dict | None:
    response = await (
        client.table("profiles")
        .select("user_id, email, display_name")
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )
    # maybe_single returns None (not an empty response) when there is no row
    if response is None:
        return None
    return response.data


async def list_my_teams(client: AsyncClient) -> list[TeamSummary]:
    # teams(id, name) joins through team_members.team_id
    response = await (
        client.table("team_members")
        .select("role, teams(id, name)")
        .execute()
    )
    return [
        TeamSummary(id=row["teams"]["id"], name=row["teams"]["name"], role=row["role"])
        for row in response.data
    ]


async def update_display_name(client: AsyncClient, user_id: str, name: str) -> None:
    await (
        client.table("profiles")
        .update({"display_name": name.strip()})
        .eq("user_id", user_id)
        .execute()
    )


async def load_me(client: AsyncClient, user_id: str) -> MeResponse | None:
    profile = await get_profile(client, user_id)
    if profile is None:
        return None

    teams = await list_my_teams(client)
    return MeResponse(
        id=profile["user_id"],
        email=profile["email"],
        display_name=profile["display_name"],
        teams=teams,
    )
