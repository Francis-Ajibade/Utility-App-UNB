from fastapi import APIRouter, Depends, HTTPException
from supabase import PostgrestAPIError

from app.auth import CurrentUser, get_current_user
from app.errors import to_http
from app.services import invites
from app.services.profiles import TeamSummary

router = APIRouter(prefix="/invites", tags=["invites"])


@router.post("/{token}/join", response_model=TeamSummary)
async def join_team(token: str, user: CurrentUser = Depends(get_current_user)):
    try:
        team = await invites.join(user.client, token)
    except PostgrestAPIError as error:
        raise to_http(error)

    if team is None:
        raise HTTPException(status_code=404, detail="Team not found")
    return team
