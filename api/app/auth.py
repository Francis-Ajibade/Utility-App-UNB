from dataclasses import dataclass

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import AsyncClient, AuthApiError

from app.db import get_user_client

security_scheme = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class CurrentUser:
    user_id: str
    email: str
    client: AsyncClient


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security_scheme),
) -> CurrentUser:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Not signed in.")

    token = credentials.credentials
    client = await get_user_client(token)

    try:
        response = await client.auth.get_user(token)
    except AuthApiError:
        raise HTTPException(status_code=401, detail="Not signed in.")

    user = response.user
    if not user.email or not user.email.lower().endswith("@unb.ca"):
        raise HTTPException(status_code=403, detail="Use your @unb.ca email.")

    return CurrentUser(user_id=user.id, email=user.email, client=client)
