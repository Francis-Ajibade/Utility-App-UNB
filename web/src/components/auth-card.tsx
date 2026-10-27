import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'grid size-9 place-items-center rounded-[10px] bg-linear-to-br from-[#F0473F] to-[#B3141C] text-sm font-bold tracking-tight text-primary-foreground shadow-[0_8px_18px_-8px_rgba(180,20,28,0.7),inset_0_1px_0_rgba(255,255,255,0.3)]',
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

// The logo with a light orbiting its edge: shown whenever the app is working
// (first load, setting up a workspace). Same orbit as the hero button's ring.
export function WorkingMark({ className }: { className?: string }) {
  return (
    <span className={cn('relative grid place-items-center rounded-[22px] p-[5px]', className)}>
      <span aria-hidden className="orbit-ring absolute inset-0 rounded-[22px]" />
      <LogoMark className="size-14 rounded-2xl text-lg" />
    </span>
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
    <main className="grid min-h-svh place-items-center p-4">
      <div className="w-full max-w-sm">
        <Logo className="mb-8 justify-center" />
        <div
          key={title}
          className="glass rounded-3xl p-8 animate-in fade-in slide-in-from-right-6 duration-300"
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

// Warm accents that sit well beside UNB red and cream. Each is a soft gradient
// tile with a white icon, so a tone reads as a colour family, not a status.
const TONES = {
  red: 'from-[#FF6A5C] to-[#C8161E] shadow-[#C8161E]/35',
  coral: 'from-[#FF9A7A] to-[#E5533D] shadow-[#E5533D]/35',
  amber: 'from-[#FFC86B] to-[#E08A1E] shadow-[#E08A1E]/35',
  rose: 'from-[#FF8FAB] to-[#D63B6A] shadow-[#D63B6A]/35',
  violet: 'from-[#C38BE0] to-[#7B3F98] shadow-[#7B3F98]/35',
  green: 'from-[#6FD3B4] to-[#1F8A70] shadow-[#1F8A70]/35',
  blue: 'from-[#7FB8F0] to-[#2F6FB8] shadow-[#2F6FB8]/35',
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
      className={cn(
        'grid size-11 shrink-0 place-items-center rounded-full bg-linear-to-br text-white shadow-lg ring-1 ring-white/40 ring-inset [&_svg]:size-5',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
