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
    <div className="flex h-svh gap-3 p-3 animate-in fade-in duration-500">
      <NavRail me={me} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 overflow-y-auto px-3 pb-6">
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
    <nav className="glass flex w-18 shrink-0 flex-col items-center gap-2 rounded-3xl py-4">
      <Link
        to="/"
        aria-label="Home"
        className="mb-4 grid size-10 place-items-center rounded-xl bg-linear-to-br from-[#F0473F] to-[#B3141C] text-sm font-bold text-primary-foreground shadow-[0_8px_18px_-8px_rgba(180,20,28,0.7),inset_0_1px_0_rgba(255,255,255,0.3)] transition hover:brightness-110"
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
              'flex w-15 flex-col items-center gap-1 rounded-2xl py-2 text-xs text-muted-foreground transition-colors hover:bg-white/50 hover:text-foreground dark:hover:bg-white/5',
              isActive &&
                'bg-white/80 text-primary shadow-[0_6px_16px_-8px_rgba(140,34,20,0.35)] ring-1 ring-white hover:bg-white/80 hover:text-primary dark:bg-white/10 dark:ring-white/10',
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
    <header className="flex shrink-0 items-center gap-3 px-3 pt-0 pb-4">
      <label className="glass flex h-12 flex-1 items-center gap-3 rounded-full px-5 transition focus-within:ring-3 focus-within:ring-primary/15">
        <ScanBarcode className="size-5 shrink-0 text-primary" />
        <input
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          placeholder="Scan a barcode, type an item, or ask a question"
        />
        <kbd className="hidden rounded-md bg-white/70 px-1.5 ring-1 ring-white dark:bg-white/5 dark:ring-white/10 font-mono text-xs text-muted-foreground sm:block">
          Enter
        </kbd>
      </label>
      <Button variant="outline" size="icon" aria-label="Notifications" className="size-12">
        <Bell />
      </Button>
      <Button disabled className="h-12 px-5">
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
      <div className="glass hidden rounded-3xl p-3 lg:block">
        <Button variant="outline" size="icon" aria-label="Open side panel" onClick={() => setOpen(true)}>
          <ChevronLeft />
        </Button>
      </div>
    )
  }

  return (
    <aside className="glass hidden w-[520px] shrink-0 flex-col overflow-hidden rounded-3xl lg:flex">
      <div className="flex items-center border-b border-white/70 px-4 dark:border-white/5">
        {TABS.map((name) => (
          <button
            key={name}
            onClick={() => setTab(name)}
            className={cn(
              'h-14 border-b-2 border-transparent px-3.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
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
            <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-linear-to-br from-[#C38BE0] to-[#7B3F98] text-xs font-semibold text-white shadow-sm">
              AI
            </span>
            <p className="rounded-2xl rounded-tl-sm bg-white/70 px-4 py-3 text-sm ring-1 ring-white dark:bg-white/5 dark:ring-white/5">
              Hi. Once your stock is imported, scan anything or ask me to find an item, log a
              change, or build a spreadsheet.
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nothing here yet.</p>
        )}
      </div>
      <div className="border-t border-white/70 p-4 dark:border-white/5">
        <input
          disabled
          className="h-12 w-full rounded-full border border-input bg-white/70 px-5 text-sm placeholder:text-muted-foreground dark:bg-white/5"
          placeholder="Ask about stock, or describe a change"
        />
      </div>
    </aside>
  )
}
