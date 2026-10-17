from fastapi import HTTPException
from supabase import PostgrestAPIError

# The text of each `raise exception` in our database functions, and its status.
ERROR_STATUS = {
    "Only admins can invite": 403,
    "Invite not found": 404,
    "This invite has expired": 410,
}


def to_http(error: PostgrestAPIError) -> Exception:
    status = ERROR_STATUS.get(error.message)
    if status is None:
        return error  # anything unexpected stays a 500
    return HTTPException(status_code=status, detail=error.message)
