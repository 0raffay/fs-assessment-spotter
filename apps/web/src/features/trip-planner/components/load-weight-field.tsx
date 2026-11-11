import { cn } from '@/lib/utils'

interface LoadWeightFieldProps {
  id: string
  value: number | null
  onChange: (value: number | null) => void
  onBlur?: () => void
  invalid?: boolean
  describedBy?: string
}

/** Whole pounds with thousands separators; non-digits are ignored as you type. */
export function LoadWeightField({
  id,
  value,
  onChange,
  onBlur,
  invalid,
  describedBy,
}: LoadWeightFieldProps) {
  return (
    <div
      className={cn(
        'border-input bg-map flex h-11 items-center gap-2 rounded-lg border px-3.5 transition-[border-color,box-shadow,background-color] duration-150',
        'hover:border-hairline-tertiary focus-within:border-ring focus-within:bg-surface-1 focus-within:ring-ring/15 focus-within:ring-4',
        invalid && 'border-destructive',
      )}
    >
      <input
        id={id}
        inputMode="numeric"
        autoComplete="off"
        placeholder="42,000"
        value={value === null ? '' : value.toLocaleString('en-US')}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, '').slice(0, 6)
          onChange(digits ? Number(digits) : null)
        }}
        onBlur={onBlur}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className="placeholder:text-ink-tertiary min-w-0 flex-1 bg-transparent text-[15px] tabular-nums outline-none"
      />
      <span className="text-ink-subtle text-sm">lb</span>
    </div>
  )
}
