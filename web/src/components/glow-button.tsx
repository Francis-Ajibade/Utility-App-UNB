import { useState, type ComponentProps, type PointerEvent } from 'react'

import { cn } from '@/lib/utils'

type Props = ComponentProps<'button'> & { loading?: boolean }

type Ink = { x: number; y: number; size: number }

// The one hero action on a screen. A red-tinted glass pill with warm light
// drifting behind it, inside a softly pulsing ring. On tap, red spreads from the
// tap point; while `loading`, a light orbits the ring. Use once per screen.
export function GlowButton({ loading = false, disabled, className, children, onPointerDown, ...props }: Props) {
  const [ink, setInk] = useState<Ink | null>(null)

  // Start the fill where the finger landed; keyboard presses fill from the centre
  function startInk(event: PointerEvent<HTMLButtonElement>) {
    const box = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - box.left
    const y = event.clientY - box.top
    const size = 2 * Math.hypot(Math.max(x, box.width - x), Math.max(y, box.height - y))
    setInk({ x, y, size })
    onPointerDown?.(event)
  }

  const fill = ink ?? { x: 0, y: 0, size: 0 }

  return (
    <span className={cn('relative isolate block rounded-full p-[5px]', className)}>
      {/* Warm light behind the glass, so the blur has colour to work with */}
      <span aria-hidden className="absolute inset-[5px] -z-10 overflow-hidden rounded-full">
        <span className="absolute top-1/2 left-[8%] size-24 -translate-y-1/2 rounded-full bg-[#E2353B]/45 blur-2xl animate-[drift_7s_ease-in-out_infinite]" />
        <span className="absolute top-1/2 right-[8%] size-24 -translate-y-1/2 rounded-full bg-[#FF9A6A]/50 blur-2xl animate-[drift_7s_ease-in-out_infinite_reverse]" />
      </span>

      {/* The ring: breathes while waiting, becomes an orbiting light while sending */}
      <span
        aria-hidden
        className={cn(
          'absolute inset-0 rounded-full',
          loading
            ? 'orbit-ring'
            : cn('border-[1.5px] border-primary/40', !disabled && 'animate-[halo_2.8s_ease-in-out_infinite]'),
        )}
      />

      <button
        disabled={disabled || loading}
        aria-busy={loading}
        onPointerDown={startInk}
        className="glass-red group relative flex h-12 w-full items-center justify-center px-8 overflow-hidden rounded-full font-semibold text-primary transition-transform focus-visible:ring-3 focus-visible:ring-primary/30 focus-visible:outline-none active:scale-[0.985] disabled:cursor-default disabled:not-aria-busy:opacity-60 dark:text-[#FF5A63]"
        {...props}
      >
        <span
          aria-hidden
          style={
            ink
              ? { left: fill.x, top: fill.y, width: fill.size, height: fill.size }
              : { left: '50%', top: '50%', width: '120%', height: '120%' }
          }
          className={cn(
            'absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-radial from-[#E2353B] to-[#B3141C]',
            loading
              ? 'scale-100 opacity-100 transition-transform duration-500 ease-out'
              : 'scale-0 opacity-0 transition-opacity duration-300',
          )}
        />
        {/* Light catching the top of the glass; stays above the fill */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-full bg-linear-to-b from-white/50 to-transparent"
        />
        <span
          className={cn(
            'relative flex items-center gap-2 transition-colors duration-300',
            loading && 'text-primary-foreground dark:text-primary-foreground',
          )}
        >
          {children}
        </span>
      </button>
    </span>
  )
}
