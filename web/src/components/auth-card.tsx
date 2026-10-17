import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'grid size-9 place-items-center rounded-[10px] bg-primary text-sm font-bold tracking-tight text-primary-foreground',
        className,
      )}
    >
      LI
    </span>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoMark />
      <span className="font-semibold tracking-tight">Lab Inventory</span>
    </div>
  )
}

type Props = {
  title: string
  subtitle?: ReactNode
  icon?: ReactNode
  children?: ReactNode
}

// The centred card every sign-in and setup screen sits in. Keyed by title, so
// moving to the next step replays the slide-in.
export function AuthCard({ title, subtitle, icon, children }: Props) {
  return (
    <main className="grid min-h-svh place-items-center bg-background p-4">
      <div className="w-full max-w-sm">
        <Logo className="mb-8 justify-center" />
        <div
          key={title}
          className="rounded-2xl border bg-card p-7 shadow-sm animate-in fade-in slide-in-from-right-6 duration-300"
        >
          {icon && <div className="mb-5">{icon}</div>}
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
          {children && <div className="mt-6">{children}</div>}
        </div>
      </div>
    </main>
  )
}

const TONES = {
  red: 'bg-primary/10 text-destructive',
  amber: 'bg-reorder/15 text-reorder',
  green: 'bg-ok/15 text-ok',
  blue: 'bg-refill/15 text-refill',
  violet: 'bg-violet/15 text-violet',
}

// A round coloured icon: above card titles, and on home tiles.
export function CardIcon({
  children,
  tone = 'red',
  className,
}: {
  children: ReactNode
  tone?: keyof typeof TONES
  className?: string
}) {
  return (
    <span
      className={cn('grid size-11 shrink-0 place-items-center rounded-full [&_svg]:size-5', TONES[tone], className)}
    >
      {children}
    </span>
  )
}
