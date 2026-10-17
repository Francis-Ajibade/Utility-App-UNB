import { useMutation } from '@tanstack/react-query'
import { Check, Link2 } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { createInviteLink } from '@/lib/api'

export const inviteUrl = (token: string) => `${window.location.origin}/join/${token}`

// Workspaces whose admin closed the "invite your team" step without copying
// the link. Their card keeps asking until a link is copied. Per browser only.
const PENDING = 'pendingInvites'

function readPending(): string[] {
  try {
    return JSON.parse(localStorage.getItem(PENDING) ?? '[]')
  } catch {
    return []
  }
}

function writePending(ids: string[]) {
  try {
    localStorage.setItem(PENDING, JSON.stringify(ids))
  } catch {
    // Storage blocked: the card just shows the small Invite button instead
  }
}

export const needsInvite = (teamId: string) => readPending().includes(teamId)
export const markInvitePending = (teamId: string) =>
  writePending([...readPending().filter((id) => id !== teamId), teamId])
export const markInviteShared = (teamId: string) =>
  writePending(readPending().filter((id) => id !== teamId))

type CopyProps = {
  teamId: string
  onCopied?: () => void
  variant?: 'default' | 'outline' | 'ghost'
  label?: string
  className?: string
}

// Makes a fresh link (the old one stops working) and copies it in one tap.
export function CopyInviteButton({
  teamId,
  onCopied,
  variant = 'outline',
  label = 'Copy invite link',
  className,
}: CopyProps) {
  const [copied, setCopied] = useState(false)
  const copy = useMutation({
    mutationFn: async () => {
      const link = await createInviteLink(teamId)
      await navigator.clipboard.writeText(inviteUrl(link.token))
    },
    onSuccess: () => {
      markInviteShared(teamId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      onCopied?.()
    },
  })

  return (
    <Button
      variant={variant}
      className={className}
      disabled={copy.isPending}
      title="Anyone with a @unb.ca email can join with this link for 7 days. A new link turns off the old one."
      onClick={() => copy.mutate()}
    >
      {copied ? <Check className="text-ok" /> : <Link2 />}
      {copy.isPending ? 'Making link...' : copied ? 'Copied' : copy.isError ? 'Try again' : label}
    </Button>
  )
}
