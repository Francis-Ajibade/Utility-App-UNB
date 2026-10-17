from supabase import AsyncClient

from app.services.profiles import TeamSummary


async def create_team(client: AsyncClient, name: str) -> TeamSummary:
    # Calls the create_team database function, which creates the team and
    # adds the caller as admin in one step. It returns the new team's id.
    name = name.strip()
    response = await client.rpc("create_team", {"p_name": name}).execute()
    return TeamSummary(id=response.data, name=name, role="admin")
