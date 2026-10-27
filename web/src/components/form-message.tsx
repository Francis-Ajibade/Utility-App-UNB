import { TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'

// Every error in a form looks and moves the same: a soft rose notice with a plain
// title and what to do next, read out by screen readers. Give it an `id` when a
// field points at it with aria-describedby.
export function ErrorNotice({ id, title, children }: { id?: string; title: string; children?: ReactNode }) {
  return (
    <div
      id={id}
      role="alert"
      className="flex items-start gap-3 rounded-2xl bg-[#FDEDEA]/85 px-4 py-3 ring-1 ring-[#F6CBC4] animate-in fade-in zoom-in-95 duration-200 dark:bg-destructive/10 dark:ring-destructive/25"
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-linear-to-br from-[#FF8FAB] to-[#D63B6A] text-white shadow-sm">
        <TriangleAlert className="size-4" />
      </span>
      <div className="min-w-0 text-sm">
        <p className="font-medium text-foreground">{title}</p>
        {children && <p className="mt-0.5 text-muted-foreground">{children}</p>}
      </div>
    </div>
  )
}
