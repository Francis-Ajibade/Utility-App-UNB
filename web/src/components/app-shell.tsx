import {
  Bell,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  LayoutGrid,
  Plus,
  ScanBarcode,
  Table,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  Link,
  Navigate,
  NavLink,
  Outlet,
  useLocation,
  useOutletContext,
  useParams,
} from 'react-router'

import { AccountMenu } from '@/components/account-menu'
import { Button } from '@/components/ui/button'
import type { Me, TeamSummary } from '@/lib/api'
import { cn } from '@/lib/utils'

export const LAST_TEAM = 'lastTeamId'

type ShellContext = { me: Me; team: TeamSummary }

// Pages inside the shell read the signed-in person and the current workspace from here.
export const useShell = () => useOutletContext<ShellContext>()

// Every screen inside a workspace: nav rail left, input bar on top, side panel right.
export function AppShell({ me }: { me: Me }) {
  const { teamId } = useParams()
  const team = me.teams.find((t) => t.id === teamId)
  const { pathname } = useLocation()

  useEffect(() => {
    if (team) localStorage.setItem(LAST_TEAM, team.id)
  }, [team])

  if (!team) return <Navigate to="/" replace />

  return (
    <div className="flex h-svh animate-in fade-in duration-500">
      <NavRail me={me} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 overflow-y-auto px-6 pb-6">
          {/* Keyed by path, so each page fades in when you switch with the rail */}
          <div key={pathname} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Outlet context={{ me, team } satisfies ShellContext} />
          </div>
        </main>
      </div>
      <SidePanel />
    </div>
  )
}

const NAV = [
  { to: '', label: 'Dashboard', icon: LayoutGrid },
  { to: 'stock', label: 'Stock', icon: Table },
  { to: 'requests', label: 'Requests', icon: CircleCheck },
]

function NavRail({ me }: { me: Me }) {
  return (
    <nav className="flex w-18 shrink-0 flex-col items-center gap-2 border-r bg-card py-4">
      <Link
        to="/"
        aria-label="Home"
        className="mb-4 grid size-10 place-items-center rounded-[10px] bg-primary text-sm font-bold text-primary-foreground transition hover:bg-[#B81F28]"
      >
        LI
      </Link>
      {NAV.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={label}
          to={to}
          end
          className={({ isActive }) =>
            cn(
              'flex w-16 flex-col items-center gap-1 rounded-lg py-2 text-xs text-muted-foreground transition-colors hover:text-foreground',
              isActive && 'bg-primary/15 text-destructive hover:text-destructive',
            )
          }
        >
          <Icon className="size-5" />
          {label}
        </NavLink>
      ))}
      <div className="mt-auto">
        <AccountMenu me={me} side="right" showHome />
      </div>
    </nav>
  )
}

// The input bar routes scans, searches and questions (CLAUDE.md > The input bar).
// It is a placeholder until stock and the assistant exist.
function TopBar() {
  return (
    <header className="flex shrink-0 items-center gap-3 p-6 pb-4">
      <label className="flex h-11 flex-1 items-center gap-3 rounded-xl border bg-card px-4 shadow-xs transition focus-within:border-foreground/25 focus-within:shadow-sm">
        <ScanBarcode className="size-5 shrink-0 text-destructive" />
        <input
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          placeholder="Scan a barcode, type an item, or ask a question"
        />
        <kbd className="hidden rounded border px-1.5 font-mono text-xs text-muted-foreground sm:block">
          Enter
        </kbd>
      </label>
      <Button variant="outline" size="icon" aria-label="Notifications" className="size-11">
        <Bell />
      </Button>
      <Button disabled>
        <Plus />
        New item
      </Button>
    </header>
  )
}

const TABS = ['Assistant', 'Files', 'Details', 'Tasks'] as const

function SidePanel() {
  const [open, setOpen] = useState(true)
  const [tab, setTab] = useState<(typeof TABS)[number]>('Assistant')

  if (!open) {
    return (
      <div className="hidden border-l bg-card p-3 lg:block">
        <Button variant="outline" size="icon" aria-label="Open side panel" onClick={() => setOpen(true)}>
          <ChevronLeft />
        </Button>
      </div>
    )
  }

  return (
    <aside className="hidden w-[520px] shrink-0 flex-col border-l bg-card lg:flex">
      <div className="flex items-center border-b px-4">
        {TABS.map((name) => (
          <button
            key={name}
            onClick={() => setTab(name)}
            className={cn(
              'h-14 border-b-2 border-transparent px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
              tab === name && 'border-primary text-foreground',
            )}
          >
            {name}
          </button>
        ))}
        <Button
          variant="ghost"
          size="icon"
          aria-label="Close side panel"
          className="ml-auto"
          onClick={() => setOpen(false)}
        >
          <ChevronRight />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'Assistant' ? (
          <div className="flex gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary/10 text-xs font-semibold text-destructive">
              AI
            </span>
            <p className="text-sm">
              Hi. Once your stock is imported, scan anything or ask me to find an item, log a
              change, or build a spreadsheet.
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nothing here yet.</p>
        )}
      </div>
      <div className="border-t p-4">
        <input
          disabled
          className="h-11 w-full rounded-lg border bg-background px-4 text-sm placeholder:text-muted-foreground"
          placeholder="Ask about stock, or describe a change"
        />
      </div>
    </aside>
  )
}
