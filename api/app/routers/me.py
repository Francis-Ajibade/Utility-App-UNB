from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.auth import CurrentUser, get_current_user
from app.services import profiles
from app.services.profiles import MeResponse

router = APIRouter(prefix="/me", tags=["me"])


class UpdateMeBody(BaseModel):
    display_name: str


@router.get("", response_model=MeResponse)
async def get_me(user: CurrentUser = Depends(get_current_user)):
    me = await profiles.load_me(user.client, user.user_id)
    if me is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    return me


@router.patch("", response_model=MeResponse)
async def update_me(body: UpdateMeBody, user: CurrentUser = Depends(get_current_user)):
    await profiles.update_display_name(user.client, user.user_id, body.display_name)

    me = await profiles.load_me(user.client, user.user_id)
    if me is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    return me
