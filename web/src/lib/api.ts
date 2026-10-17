import { supabase } from '@/lib/supabase'

export type TeamSummary = { id: string; name: string; role: 'admin' | 'approver' | 'member' }

export type Me = {
  id: string
  email: string
  display_name: string | null
  teams: TeamSummary[]
}

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

// Every API call goes through here, so every call carries the user's token.
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data } = await supabase.auth.getSession()
  const res = await fetch(`${import.meta.env.VITE_API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${data.session?.access_token ?? ''}`,
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body.detail ?? res.statusText)
  }
  return res.json()
}

export const getMe = () => request<Me>('/me')

export const updateMe = (display_name: string) =>
  request<Me>('/me', { method: 'PATCH', body: JSON.stringify({ display_name }) })

export const createTeam = (name: string) =>
  request<TeamSummary>('/teams', { method: 'POST', body: JSON.stringify({ name }) })

export type InviteLink = { token: string; expires_at: string }

export const createInviteLink = (teamId: string) =>
  request<InviteLink>(`/teams/${teamId}/invite-link`, { method: 'POST' })
