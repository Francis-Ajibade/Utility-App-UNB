from supabase import AsyncClient, AsyncClientOptions, acreate_client

from app.config import settings


async def get_user_client(token: str) -> AsyncClient:
    # A new client per request, carrying this user's token, so every query
    # runs as them and RLS decides what they can see.
    options = AsyncClientOptions(
        headers={"Authorization": f"Bearer {token}"},
        persist_session=False,
        auto_refresh_token=False,
    )

    return await acreate_client(settings.supabase_url, settings.supabase_anon_key, options=options)
