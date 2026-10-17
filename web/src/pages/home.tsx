import {
  Activity,
  ArrowRight,
  Boxes,
  CalendarDays,
  Check,
  ChevronsUpDown,
  FileSpreadsheet,
  Link2,
  MessagesSquare,
  Plus,
  Users,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'

import { AccountMenu } from '@/components/account-menu'
import { LAST_TEAM } from '@/components/app-shell'
import { CardIcon, Logo, LogoMark } from '@/components/auth-card'
import { CreateWorkspaceDialog } from '@/components/create-workspace-dialog'
import { CopyInviteButton, needsInvite } from '@/components/invite'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Me, TeamSummary } from '@/lib/api'
import { greeting, initials } from '@/lib/names'
import { cn } from '@/lib/utils'

function readLastTeam(): string | null {
  try {
    return localStorage.getItem(LAST_TEAM)
  } catch {
    return null
  }
}

// Where everyone lands after sign-in: one workspace at a time, as widgets for
// its apps (Inventory now, Scheduler soon), its people and its setup.
export function Home({ me }: { me: Me }) {
  const [creating, setCreating] = useState(false)
  const [selectedId, setSelectedId] = useState(readLastTeam)
  // Bumped after an invite link is copied, so the setup card re-reads it
  const [, setInviteTick] = useState(0)

  const team = me.teams.find((t) => t.id === selectedId) ?? me.teams[0]
  const firstName = (me.display_name ?? '').split(' ')[0]
  const today = new Date().toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' })

  function select(id: string) {
    setSelectedId(id)
    try {
      localStorage.setItem(LAST_TEAM, id)
    } catch {
      // Storage blocked: the choice lasts until reload
    }
  }

  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          {team ? (
            <div className="flex min-w-0 items-center gap-3">
              <LogoMark />
              <WorkspaceSwitcher teams={me.teams} current={team} onSelect={select} onCreate={() => setCreating(true)} />
            </div>
          ) : (
            <Logo />
          )}
          <AccountMenu me={me} />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pt-8 pb-16 sm:px-6 sm:pt-10">
        <section className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <p className="text-sm text-muted-foreground">{today}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
            {greeting(new Date().getHours())}, {firstName}
          </h1>
        </section>

        {team ? (
          <div key={team.id} className="mt-8 flex flex-col gap-4">
            {team.role === 'admin' && (
              <SetupCard team={team} onCopied={() => setInviteTick((n) => n + 1)} />
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Tile index={1} to={`/t/${team.id}`}>
                <TileHead icon={<Boxes />} tone="red" title="Inventory" action="Open" />
                <p className="mt-6 text-2xl font-semibold tracking-tight">No stock yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Import your spreadsheet to see what is out, low, and full.
                </p>
              </Tile>

              <Tile index={2}>
                <TileHead icon={<CalendarDays />} tone="violet" title="Scheduler" badge="Coming soon" />
                <p className="mt-6 text-2xl font-semibold tracking-tight text-muted-foreground">
                  Lab sessions
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Book rooms and equipment, and see who is in which lab.
                </p>
              </Tile>

              <Tile index={3}>
                <TileHead icon={<Users />} tone="green" title="Team" />
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex -space-x-2">
                    <span className="grid size-9 place-items-center rounded-full border-2 border-card bg-secondary text-xs font-semibold">
                      {initials(me.display_name, me.email)}
                    </span>
                    <span className="grid size-9 place-items-center rounded-full border-2 border-dashed border-border bg-card text-muted-foreground">
                      <Plus className="size-4" />
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You are {team.role === 'admin' ? 'an admin' : `a ${team.role}`} here
                  </p>
                </div>
                {team.role === 'admin' ? (
                  <CopyInviteButton
                    teamId={team.id}
                    label="Invite people"
                    className="mt-4 w-full sm:w-auto"
                    onCopied={() => setInviteTick((n) => n + 1)}
                  />
                ) : (
                  <p className="mt-4 text-sm text-muted-foreground">Ask an admin to invite others.</p>
                )}
              </Tile>

              <Tile index={4}>
                <TileHead icon={<MessagesSquare />} tone="blue" title="Teams channel" badge="Coming soon" />
                <p className="mt-6 text-2xl font-semibold tracking-tight text-muted-foreground">
                  Not connected
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Reorder and out of stock alerts will post to your team's channel.
                </p>
              </Tile>
            </div>

            <section
              style={{ animationDelay: '300ms' }}
              className="rounded-2xl border bg-card p-5 animate-in fade-in slide-in-from-bottom-3 duration-500 [animation-fill-mode:both] sm:p-6"
            >
              <h2 className="font-semibold">Recent activity</h2>
              <div className="mt-4 flex items-center gap-3 rounded-xl bg-secondary/60 px-4 py-5">
                <Activity className="size-5 shrink-0 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Nothing yet. Stock changes, tasks and requests show up here as they happen.
                </p>
              </div>
            </section>
          </div>
        ) : (
          <EmptyState onCreate={() => setCreating(true)} />
        )}

        <p className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
          <Link2 className="size-4 shrink-0" />
          Got an invite link? Open it, and you'll join that workspace.
        </p>
      </main>

      <CreateWorkspaceDialog
        me={me}
        open={creating}
        onOpenChange={setCreating}
        onCreated={(created) => select(created.id)}
      />
    </div>
  )
}

function WorkspaceSwitcher({
  teams,
  current,
  onSelect,
  onCreate,
}: {
  teams: TeamSummary[]
  current: TeamSummary
  onSelect: (id: string) => void
  onCreate: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex min-w-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-secondary data-popup-open:bg-secondary">
        <span className="truncate font-semibold">{current.name}</span>
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
          {teams.map((t) => (
            <DropdownMenuItem key={t.id} onClick={() => onSelect(t.id)} className="gap-3 py-2">
              <span className="grid size-7 shrink-0 place-items-center rounded-md bg-primary/10 text-[11px] font-semibold text-destructive">
                {initials(t.name, t.name)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate">{t.name}</span>
                <span className="text-xs text-muted-foreground capitalize">{t.role}</span>
              </span>
              {t.id === current.id && <Check className="text-destructive" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onCreate} className="gap-3 py-2">
          <span className="grid size-7 place-items-center rounded-md border border-dashed">
            <Plus />
          </span>
          New workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const tileClass =
  'group flex flex-col rounded-2xl border bg-card p-5 text-left animate-in fade-in slide-in-from-bottom-3 duration-500 [animation-fill-mode:both] sm:p-6'

// A home widget. With `to` the whole tile is a link and lifts on hover.
function Tile({ index, to, children }: { index: number; to?: string; children: ReactNode }) {
  const style = { animationDelay: `${index * 60}ms` }
  if (to) {
    return (
      <Link
        to={to}
        style={style}
        className={cn(
          tileClass,
          'transition-all hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-lg hover:shadow-black/5 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
        )}
      >
        {children}
      </Link>
    )
  }
  return (
    <div style={style} className={tileClass}>
      {children}
    </div>
  )
}

function TileHead({
  icon,
  tone,
  title,
  action,
  badge,
}: {
  icon: ReactNode
  tone: 'red' | 'violet' | 'green' | 'blue'
  title: string
  action?: string
  badge?: string
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <CardIcon tone={tone} className="size-10 rounded-xl">
          {icon}
        </CardIcon>
        <span className="font-semibold">{title}</span>
      </div>
      {action && (
        <span className="flex items-center gap-1 text-sm font-medium text-destructive">
          {action}
          <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
        </span>
      )}
      {badge && (
        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground">{badge}</span>
      )}
    </div>
  )
}

// Admin checklist. Creating the workspace is always done; inviting is done once
// a link has been copied; importing finishes when stock exists (not built yet).
function SetupCard({ team, onCopied }: { team: TeamSummary; onCopied: () => void }) {
  const invited = !needsInvite(team.id)
  const steps = [
    { label: 'Create your workspace', done: true },
    { label: 'Invite your team', done: invited },
    { label: 'Import your spreadsheet', done: false },
  ]
  const doneCount = steps.filter((s) => s.done).length

  return (
    <section className="rounded-2xl border bg-card p-5 animate-in fade-in slide-in-from-bottom-3 duration-500 sm:p-6">
      <div className="flex items-center gap-4">
        <ProgressRing done={doneCount} total={steps.length} />
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">Get set up</h2>
          <p className="text-sm text-muted-foreground">
            {doneCount} of {steps.length} done. Next: {steps.find((s) => !s.done)?.label.toLowerCase()}.
          </p>
        </div>
      </div>

      <ol className="mt-5 grid gap-2 sm:grid-cols-3">
        {steps.map((step, i) => (
          <li
            key={step.label}
            className={cn(
              'flex items-center gap-3 rounded-xl border px-3.5 py-3 text-sm',
              step.done ? 'border-transparent bg-secondary/60 text-muted-foreground' : 'bg-card',
            )}
          >
            <span
              className={cn(
                'grid size-6 shrink-0 place-items-center rounded-full text-xs font-semibold',
                step.done ? 'bg-ok/15 text-ok' : 'border text-muted-foreground',
              )}
            >
              {step.done ? <Check className="size-3.5" /> : i + 1}
            </span>
            <span className={cn('flex-1', step.done && 'line-through decoration-muted-foreground/40')}>
              {step.label}
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        {!invited && <CopyInviteButton teamId={team.id} variant="default" onCopied={onCopied} />}
        <Button
          variant={invited ? 'default' : 'outline'}
          nativeButton={false}
          render={<Link to={`/t/${team.id}`} />}
        >
          <FileSpreadsheet />
          Import spreadsheet
        </Button>
      </div>
    </section>
  )
}

function ProgressRing({ done, total }: { done: number; total: number }) {
  const r = 20
  const circumference = 2 * Math.PI * r
  return (
    <div className="relative grid size-12 shrink-0 place-items-center">
      <svg viewBox="0 0 48 48" className="absolute inset-0 -rotate-90">
        <circle cx="24" cy="24" r={r} fill="none" strokeWidth="4" className="stroke-secondary" />
        <circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          className="stroke-primary transition-[stroke-dashoffset] duration-700"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - done / total)}
        />
      </svg>
      <span className="font-mono text-xs font-semibold">
        {done}/{total}
      </span>
    </div>
  )
}

const STEPS = ['Name your workspace', 'Invite your team', 'Import your spreadsheet']

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <section className="mt-8 overflow-hidden rounded-2xl border bg-card animate-in fade-in slide-in-from-bottom-3 duration-500 [animation-delay:100ms] [animation-fill-mode:both]">
      <div className="grid gap-8 p-6 sm:p-10 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Create your first workspace</h2>
          <p className="mt-2 max-w-lg text-muted-foreground">
            A workspace is one lab team. Everyone in it shares the same stock, and soon the same
            schedule. Start one for your lab, or ask your admin for an invite link.
          </p>
          <ol className="mt-6 flex flex-col gap-3 sm:flex-row sm:gap-6">
            {STEPS.map((step, i) => (
              <li key={step} className="flex items-center gap-2 text-sm">
                <span
                  className={cn(
                    'grid size-6 place-items-center rounded-full font-mono text-xs',
                    i === 0 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground',
                  )}
                >
                  {i + 1}
                </span>
                <span className={i === 0 ? 'text-foreground' : 'text-muted-foreground'}>{step}</span>
              </li>
            ))}
          </ol>
          <Button className="mt-8" onClick={onCreate}>
            <Plus />
            Create workspace
          </Button>
        </div>
        <AppsPreview />
      </div>
    </section>
  )
}

// What lives inside a workspace, as two tilted tiles that straighten on hover.
function AppsPreview() {
  return (
    <div className="relative mx-auto hidden h-44 w-56 md:block" aria-hidden>
      <div className="absolute top-2 left-0 flex w-40 -rotate-6 items-center gap-3 rounded-xl border bg-card p-3 shadow-lg transition-transform duration-500 hover:rotate-0">
        <CardIcon className="size-9 rounded-lg">
          <Boxes />
        </CardIcon>
        <span className="text-sm font-medium">Inventory</span>
      </div>
      <div className="absolute right-0 bottom-2 flex w-40 rotate-6 items-center gap-3 rounded-xl border bg-card p-3 shadow-lg transition-transform duration-500 hover:rotate-0">
        <CardIcon tone="violet" className="size-9 rounded-lg">
          <CalendarDays />
        </CardIcon>
        <span className="text-sm text-muted-foreground">Scheduler</span>
      </div>
    </div>
  )
}
