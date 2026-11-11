import { cn } from '@/lib/utils'

import type { StatusInfo, StatusTone } from '../types'

const DOT: Record<StatusTone, string> = {
  ok: 'bg-success animate-[sr-breathe_1.6s_ease-in-out_infinite]',
  pending: 'bg-primary animate-pulse',
  error: 'bg-destructive',
  idle: 'bg-ink-tertiary',
}

export function StatusIndicator({ tone, label }: StatusInfo) {
  return (
    <span
      role="status"
      className="text-ink-subtle flex items-center gap-2 text-[13px] whitespace-nowrap"
    >
      <span aria-hidden className={cn('size-[7px] rounded-full', DOT[tone])} />
      {label}
    </span>
  )
}
