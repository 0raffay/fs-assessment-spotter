import { LoaderCircleIcon, TriangleAlertIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { isApiError } from '@/lib/api'

/** Card-shaped skeletons while the plan loads. */
export function RouteListSkeleton() {
  return (
    <section aria-label="Planning routes" aria-busy className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium tracking-[-0.2px]">Routes</h2>
        <span className="text-ink-subtle text-[13px]">Planning…</span>
      </div>
      {[62, 48, 56].map((width) => (
        <div
          key={width}
          className="bg-surface-1 border-hairline flex flex-col gap-3 rounded-xl border p-4"
        >
          <div className="flex items-center gap-2.5">
            <Skeleton className="size-[26px] rounded-[9px]" />
            <Skeleton className="h-3.5 rounded-lg" style={{ width: `${width}%` }} />
          </div>
          <Skeleton className="h-1.5 w-full rounded-full" />
          <Skeleton className="h-3 w-1/2 rounded-lg" />
        </div>
      ))}
      <p role="status" className="text-ink-subtle flex items-center gap-2 text-[13px]">
        <LoaderCircleIcon className="text-primary size-3.5 animate-spin" />
        Checking weather at each checkpoint’s arrival time
      </p>
    </section>
  )
}

export function RouteListError({
  error,
  onRetry,
  retrying,
}: {
  error: unknown
  onRetry: () => void
  retrying: boolean
}) {
  const message = isApiError(error) ? error.userMessage : 'Something went wrong. Please try again.'
  return (
    <div
      role="alert"
      className="bg-destructive/7 flex gap-3 rounded-xl p-4 shadow-[inset_0_0_0_1px_rgb(248_113_113/0.35)]"
    >
      <TriangleAlertIcon
        className="text-destructive mt-0.5 size-[18px] shrink-0"
        strokeWidth={1.75}
      />
      <div className="flex flex-col items-start gap-1.5">
        <span className="text-sm font-medium">Couldn’t plan routes</span>
        <span className="text-ink-muted text-sm leading-relaxed">
          {message} Your trip details are kept.
        </span>
        <Button
          variant="secondary"
          onClick={onRetry}
          disabled={retrying}
          className="mt-1.5 h-9 rounded-lg px-3.5 active:scale-95"
        >
          {retrying ? <LoaderCircleIcon className="size-3.5 animate-spin" /> : null}
          Try again
        </Button>
      </div>
    </div>
  )
}
