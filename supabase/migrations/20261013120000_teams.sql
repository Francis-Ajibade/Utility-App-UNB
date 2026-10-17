
CREATE TABLE IF NOT EXISTS public.profiles (
    user_id         UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    email           TEXT NOT NULL UNIQUE,
    display_name    TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.teams (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT NOT NULL,
    webhook_url   TEXT,  -- the Teams channel link
    created_by    UUID REFERENCES auth.users (id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.team_members (
    team_id   UUID NOT NULL REFERENCES public.teams (id) ON DELETE CASCADE,
    user_id   UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    role      TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'approver', 'member')),
    PRIMARY KEY (team_id, user_id)
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
