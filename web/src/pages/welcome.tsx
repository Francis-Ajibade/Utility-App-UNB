import { ArrowRight, Bell, CalendarDays, MessageSquare, PackageCheck, ScanBarcode } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'

import { LogoMark } from '@/components/auth-card'
import { cn } from '@/lib/utils'

// Shown while the app checks the session and loads the account.
export function Splash() {
  return (
    <main className="grid min-h-svh place-items-center bg-background">
      <div className="flex flex-col items-center gap-5">
        <LogoMark className="size-14 rounded-2xl text-lg animate-in fade-in zoom-in-75 duration-500" />
        <div className="h-1 w-28 overflow-hidden rounded-full bg-secondary">
          <div className="h-full w-2/5 rounded-full bg-primary animate-[loading-bar_1.1s_ease-in-out_infinite]" />
        </div>
      </div>
    </main>
  )
}

type Slide = { title: string; text: string; icon: ReactNode; preview: ReactNode }

// The previews sit on white over the red panel in both themes, so they use fixed colours.
const SLIDES: Slide[] = [
  {
    title: 'Scan it, and it is logged',
    text: 'Scan a box or tap the card. The whole team sees the change at once.',
    icon: <ScanBarcode />,
    preview: (
      <PreviewRow
        title={'Abdominal pads, 8 x 10"'}
        detail="Room 310 · Back shelf"
        right={
          <>
            <Chip className="bg-[#E7F5EC] text-[#1A7F37]">+1 box</Chip>
            <span className="font-mono text-xl text-neutral-900">124</span>
          </>
        }
      />
    ),
  },
  {
    title: 'Ask instead of searching',
    text: 'Ask what is running low, where something is kept, or for a spreadsheet.',
    icon: <MessageSquare />,
    preview: (
      <div className="flex flex-col gap-2 text-sm text-neutral-900">
        <p className="self-end rounded-xl rounded-br-sm bg-neutral-100 px-3.5 py-2">What is low in 310?</p>
        <p className="self-start rounded-xl rounded-bl-sm border border-neutral-200 px-3.5 py-2">
          Gauze rolls: 6 left. Want me to flag a reorder?
        </p>
      </div>
    ),
  },
  {
    title: 'Never run out',
    text: 'Low and empty items post to your Teams channel before anyone notices.',
    icon: <Bell />,
    preview: (
      <PreviewRow
        title="Chlorhexidine 2% swabs"
        detail="1 unopened box left"
        right={<Chip className="bg-[#FFF4DB] text-[#9A6700]">Reorder</Chip>}
      />
    ),
  },
  {
    title: 'Shelves stay full',
    text: 'When a shelf runs low, the app says which box to bring and from where.',
    icon: <PackageCheck />,
    preview: (
      <PreviewRow
        title="Bring 1 box of abdominal pads"
        detail="From Storage Unit · Shelf 1"
        right={<Chip className="border border-[#0969DA] text-[#0969DA]">Done</Chip>}
      />
    ),
  },
]

function PreviewRow({ title, detail, right }: { title: string; detail: string; right: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 text-left">
      <div className="min-w-0">
        <p className="truncate font-medium text-neutral-900">{title}</p>
        <p className="text-sm text-neutral-500">{detail}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2.5">{right}</div>
    </div>
  )
}

function Chip({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap', className)}>
      {children}
    </span>
  )
}

const SLIDE_MS = 4500

// First screen for someone who has never signed in on this device.
export function Welcome({ onStart }: { onStart: () => void }) {
  const [index, setIndex] = useState(0)

  // Restarts whenever the slide changes, so tapping a dot gives it the full time.
  useEffect(() => {
    const timer = setTimeout(() => setIndex((i) => (i + 1) % SLIDES.length), SLIDE_MS)
    return () => clearTimeout(timer)
  }, [index])

  const slide = SLIDES[index]

  return (
    <main className="grid min-h-svh bg-background lg:grid-cols-[1fr_1.1fr]">
      <section className="order-2 flex flex-col items-center justify-center px-6 py-12 text-center lg:order-1">
        <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-3 duration-700">
          <LogoMark className="mx-auto size-12 rounded-xl text-base" />
          <h1 className="mt-6 text-3xl font-semibold tracking-tight">Welcome to Lab Inventory</h1>
          <p className="mt-2 text-muted-foreground">
            Shared stock for the UNB Bachelor of Health labs, on web and mobile.
          </p>
          <button
            onClick={onStart}
            className="group mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary font-medium text-primary-foreground transition hover:bg-[#B81F28] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:scale-[0.99]"
          >
            Continue
            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
          </button>
          <p className="mt-6 inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
            <CalendarDays className="size-3.5 text-violet" />
            Lab scheduler coming soon
          </p>
        </div>
      </section>

      <section className="order-1 p-3 lg:order-2">
        <div className="relative flex h-full min-h-[440px] flex-col items-center justify-center overflow-hidden rounded-[28px] bg-primary px-6 py-10 text-center text-white">
          {/* Two faint rings for depth, nothing busier */}
          <div className="pointer-events-none absolute -top-40 -right-40 size-[480px] rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -bottom-52 -left-52 size-[560px] rounded-full border border-white/10" />

          <div
            key={slide.title}
            className="relative flex w-full max-w-md flex-col items-center animate-in fade-in slide-in-from-right-8 duration-500"
          >
            <span className="grid size-20 place-items-center rounded-full bg-white/15 ring-8 ring-white/5 [&_svg]:size-9">
              {slide.icon}
            </span>
            <div className="mt-8 w-full rounded-2xl bg-white p-4 shadow-2xl shadow-black/20 animate-[float_5s_ease-in-out_infinite]">
              {slide.preview}
            </div>
            <h2 className="mt-10 text-2xl font-semibold tracking-tight">{slide.title}</h2>
            <p className="mt-2 max-w-sm text-white/80">{slide.text}</p>
          </div>

          <div className="relative mt-8 flex gap-2">
            {SLIDES.map((s, i) => (
              <button
                key={s.title}
                aria-label={`Show slide ${i + 1}`}
                onClick={() => setIndex(i)}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70',
                )}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
