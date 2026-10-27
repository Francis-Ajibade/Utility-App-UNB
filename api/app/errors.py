from fastapi import HTTPException
from supabase import PostgrestAPIError

# The text of each `raise exception` in our database functions, and its status.
ERROR_STATUS = {
    # Invites
    "Only admins can invite": 403,
    "Invite not found": 404,
    "This invite has expired": 410,

    # Stock: not allowed (403)
    "Not a member of this workspace": 403,

    # Stock: doesn't exist (404)
    "Product not found": 404,
    "Nothing stocked here": 404,

    # Stock: clashes with what's there (409)
    "This item is archived": 409,
    "Rows cannot move to another workspace": 409,
    "Not enough sealed boxes": 409,
    "Not enough single items": 409,
    "No sealed boxes here": 409,
    "Stock changed while you were counting": 409,
    "Pick a different place": 409,

    # Stock: the request itself is wrong (422)
    "Amounts must be 0 or more": 422,
    "Add at least one box or item": 422,
    "Take at least one box or item": 422,
    "Room and spot are required": 422,
    "Say who it was given to": 422,
    "Enter both numbers": 422,
    "Start the count again": 422,
    "Unknown change": 422,
}


def to_http(error: PostgrestAPIError) -> Exception:
    status = ERROR_STATUS.get(error.message)
    if status is None:
        return error  # anything unexpected stays a 500
    return HTTPException(status_code=status, detail=error.message)
