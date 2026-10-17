import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Copy, FlaskConical, PartyPopper } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import { CardIcon, LogoMark } from '@/components/auth-card'
import { inviteUrl, markInvitePending, markInviteShared } from '@/components/invite'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createInviteLink, createTeam, type Me, type TeamSummary } from '@/lib/api'

type Props = {
  me: Me
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (team: TeamSummary) => void
}

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Two steps in one pop-up: name the workspace, then share its invite link.
// Closing at step two is fine; the card keeps an invite prompt until a link is copied.
export function CreateWorkspaceDialog({ me, open, onOpenChange, onCreated }: Props) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [team, setTeam] = useState<TeamSummary | null>(null)

  const create = useMutation({
    // Hold the "Setting up" screen for a moment, so it reads as a step rather than a flicker
    mutationFn: async (teamName: string) => (await Promise.all([createTeam(teamName), pause(900)]))[0],
    onSuccess: (created) => {
      markInvitePending(created.id)
      setTeam(created)
      onCreated?.(created)
      queryClient.invalidateQueries({ queryKey: ['me', me.id] })
    },
  })

  function close(next: boolean) {
    onOpenChange(next)
    if (!next) {
      // Wait for the close animation before resetting, so the content doesn't jump
      setTimeout(() => {
        setName('')
        setTeam(null)
        create.reset()
      }, 200)
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    if (name.trim()) create.mutate(name.trim())
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="gap-0 p-6 sm:max-w-md">
        {team ? (
          <InviteStep team={team} onDone={() => close(false)} />
        ) : create.isPending ? (
          <SettingUp name={name.trim()} />
        ) : (
          <form onSubmit={submit} className="animate-in fade-in duration-200">
            <DialogHeader className="gap-0">
              <CardIcon>
                <FlaskConical />
              </CardIcon>
              <DialogTitle className="mt-4 text-xl font-semibold">New workspace</DialogTitle>
              <DialogDescription className="mt-2">
                A workspace is one lab team. Everyone in it shares the same stock now, and the
                same schedule soon. You'll be its admin.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6 flex flex-col gap-2">
              <Label htmlFor="workspace-name">Workspace name</Label>
              <Input
                id="workspace-name"
                autoFocus
                placeholder="Bachelor of Health labs"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              {create.error && <p className="text-sm text-destructive">{create.error.message}</p>}
            </div>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={() => close(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!name.trim()}>
                Create workspace
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

function SettingUp({ name }: { name: string }) {
  return (
    <div className="flex flex-col items-center py-10 text-center animate-in fade-in zoom-in-95 duration-300">
      <LogoMark className="size-12 rounded-xl animate-pulse" />
      <DialogTitle className="mt-5 text-lg font-semibold">Setting up {name}...</DialogTitle>
      <DialogDescription className="mt-1">Making you its admin.</DialogDescription>
    </div>
  )
}

function InviteStep({ team, onDone }: { team: TeamSummary; onDone: () => void }) {
  const [copied, setCopied] = useState(false)
  const invite = useQuery({
    queryKey: ['invite-link', team.id],
    queryFn: () => createInviteLink(team.id),
    staleTime: Infinity,
    gcTime: 0,
  })

  const link = invite.data ? inviteUrl(invite.data.token) : ''
  const expires = invite.data
    ? new Date(invite.data.expires_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })
    : ''

  async function copy() {
    await navigator.clipboard.writeText(link)
    markInviteShared(team.id)
    setCopied(true)
  }

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <DialogHeader className="gap-0">
        <CardIcon tone="green">
          <PartyPopper />
        </CardIcon>
        <DialogTitle className="mt-4 text-xl font-semibold">{team.name} is ready</DialogTitle>
        <DialogDescription className="mt-2">
          Invite your team now. Anyone with a @unb.ca email can use this link to join as a member.
        </DialogDescription>
      </DialogHeader>

      <div className="mt-6 flex flex-col gap-2">
        <Label htmlFor="invite-link">Invite link</Label>
        <div className="flex gap-2">
          <Input
            id="invite-link"
            readOnly
            value={link}
            placeholder="Making your link..."
            onFocus={(e) => e.target.select()}
            className="font-mono text-xs"
          />
          <Button disabled={!link} onClick={copy} className="shrink-0">
            {copied ? <Check /> : <Copy />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
        {invite.error ? (
          <p className="text-sm text-destructive">
            Couldn't make the link. You can copy one from the workspace card.
          </p>
        ) : (
          expires && <p className="text-xs text-muted-foreground">Works until {expires}.</p>
        )}
      </div>

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          {copied ? 'Paste it in Teams or an email.' : 'Skip for now and invite from the card later.'}
        </p>
        <Button variant={copied ? 'default' : 'ghost'} onClick={onDone}>
          {copied ? 'Done' : 'Skip for now'}
        </Button>
      </div>
    </div>
  )
}
