import { ChevronDown, FileSpreadsheet } from 'lucide-react'
import { Link } from 'react-router'

import { useShell } from '@/components/app-shell'
import { CardIcon } from '@/components/auth-card'
import { CopyInviteButton } from '@/components/invite'
import { Button } from '@/components/ui/button'
import { greeting } from '@/lib/names'

// First run shows only the import step (CLAUDE.md > UI > Dashboard). Key numbers,
// current stock, tasks, needs action and live activity arrive with the stock tables.
export function Dashboard() {
  const { me, team } = useShell()
  const now = new Date()
  const today = now.toLocaleDateString('en-CA', { weekday: 'long', month: 'short', day: 'numeric' })
  const firstName = (me.display_name ?? '').split(' ')[0]

  return (
    <>
      <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <span className="capitalize">{team.role}</span>·
        <Link to="/" className="flex items-center gap-0.5 hover:text-foreground">
          {team.name}
          <ChevronDown className="size-4" />
        </Link>
        ·<span>{today}</span>
      </p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">
        {greeting(now.getHours())}, <span className="text-primary">{firstName}</span>
      </h1>

      <section className="glass mt-8 flex flex-col items-center rounded-3xl px-6 py-16 text-center">
        <CardIcon tone="green" className="size-16 rounded-2xl [&_svg]:size-7">
          <FileSpreadsheet />
        </CardIcon>
        <h2 className="mt-4 text-xl font-semibold">Import your current spreadsheet</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Bring in your items, rooms and counts from the lab's Excel sheet. You'll check every
          row before anything is saved.
        </p>
        <Button className="mt-6" disabled>
          Import spreadsheet
        </Button>
        {team.role === 'admin' && (
          <CopyInviteButton teamId={team.id} variant="ghost" label="Invite your team" className="mt-3" />
        )}
      </section>
    </>
  )
}

// Stock and Requests until their tables exist.
export function NotYet({ title }: { title: string }) {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Import your spreadsheet first.</p>
    </>
  )
}
