import { CalendarIcon } from 'lucide-react'
import { useState } from 'react'

import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const FIELD =
  'border-input bg-map flex h-11 items-center gap-2.5 rounded-lg border px-3.5 max-sm:gap-2 max-sm:px-3 text-[15px] transition-[border-color,box-shadow,background-color] duration-150 hover:border-hairline-tertiary focus-within:border-ring focus-within:bg-surface-1 focus-within:ring-4 focus-within:ring-ring/15'

/** Opens the browser's time picker where supported (it throws if the input isn't focusable yet). */
function openPicker(input: HTMLInputElement) {
  try {
    input.showPicker()
  } catch {
    // Older browsers: typing still works.
  }
}

function startOfToday(): Date {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

function toDate(value: string): Date | undefined {
  const [y, m, d] = value.split('-').map(Number)
  return y && m && d ? new Date(y, m - 1, d) : undefined
}

function toValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function dateLabel(value: string): string {
  const date = toDate(value)
  return date
    ? date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    : 'Date'
}

interface DepartureFieldsProps {
  date: string
  time: string
  onDateChange: (date: string) => void
  onTimeChange: (time: string) => void
  /** Time zone the wall clock is in (the origin's), shown after the time. */
  zoneLabel: string
  invalid?: boolean
  labelledBy: string
}

/** Departure date (calendar popover) and time, in the origin's local time. */
export function DepartureFields({
  date,
  time,
  onDateChange,
  onTimeChange,
  zoneLabel,
  invalid,
  labelledBy,
}: DepartureFieldsProps) {
  const [open, setOpen] = useState(false)
  const [today] = useState(startOfToday)

  return (
    <div className="grid grid-cols-2 gap-2" role="group" aria-labelledby={labelledBy}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Departure date"
            className={cn(FIELD, 'text-left active:scale-[0.99]', invalid && 'border-destructive')}
          >
            <CalendarIcon className="text-ink-subtle size-4" strokeWidth={1.75} />
            <span className={date ? 'text-ink' : 'text-ink-tertiary'}>{dateLabel(date)}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="border-hairline-strong bg-surface-2 w-auto rounded-xl p-2"
        >
          <Calendar
            mode="single"
            selected={toDate(date)}
            disabled={{ before: today }}
            onSelect={(next) => {
              if (next) onDateChange(toValue(next))
              setOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>

      <label className={cn(FIELD, invalid && 'border-destructive')}>
        <span className="sr-only">Departure time</span>
        <input
          type="time"
          value={time}
          onChange={(event) => onTimeChange(event.target.value)}
          aria-invalid={invalid || undefined}
          // The whole field opens the native picker; its own icon is hidden so 12-hour times fit.
          onClick={(event) => openPicker(event.currentTarget)}
          className="min-w-0 flex-1 cursor-pointer bg-transparent tabular-nums outline-none max-sm:text-sm [&::-webkit-calendar-picker-indicator]:hidden"
        />
        <span className="text-ink-subtle shrink-0 text-[11px]">{zoneLabel}</span>
      </label>
    </div>
  )
}
