import { LoaderCircleIcon } from 'lucide-react'
import { useId, useState, type KeyboardEvent, type ReactNode } from 'react'

import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export type SearchStatus = 'idle' | 'loading' | 'error' | 'success'

export interface SearchComboboxProps<TItem> {
  id?: string
  /** Short inline label shown inside the field ("From"). */
  label: string
  placeholder: string
  value: TItem | null
  onChange: (item: TItem | null) => void
  /** What the person typed. */
  query: string
  onQueryChange: (query: string) => void
  items: readonly TItem[]
  status: SearchStatus
  getKey: (item: TItem) => string
  getLabel: (item: TItem) => string
  renderItem?: (item: TItem) => ReactNode
  emptyText?: string
  errorText?: string
  invalid?: boolean
  describedBy?: string
  className?: string
  autoFocus?: boolean
}

/**
 * A typed, accessible search-as-you-type combobox (WAI-ARIA combobox pattern). Data fetching is the
 * caller's job; this only renders `items` and reports choices, so it works for any item type.
 */
export function SearchCombobox<TItem>({
  id,
  label,
  placeholder,
  value,
  onChange,
  query,
  onQueryChange,
  items,
  status,
  getKey,
  getLabel,
  renderItem,
  emptyText = 'No matches',
  errorText = 'Search failed. Try again.',
  invalid,
  describedBy,
  className,
  autoFocus,
}: SearchComboboxProps<TItem>) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const listId = `${inputId}-list`
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)

  const inputValue = value ? getLabel(value) : query
  const showList = open && query.trim().length >= 2

  function choose(item: TItem) {
    onChange(item)
    onQueryChange('')
    setOpen(false)
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActive((i) => Math.min(i + 1, Math.max(items.length - 1, 0)))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (event.key === 'Enter' && !value && query.trim()) {
      // Mid-search, Enter picks the highlighted match and never submits the surrounding form.
      event.preventDefault()
      const item = items[active]
      if (item && status === 'success') choose(item)
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  const activeItem = items[active]

  return (
    <Popover open={showList} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div
          className={cn(
            'border-input bg-map flex h-11 items-center gap-2.5 rounded-lg border px-3.5 transition-[border-color,box-shadow,background-color] duration-150',
            'hover:border-hairline-tertiary focus-within:border-ring focus-within:bg-surface-1 focus-within:ring-ring/15 focus-within:ring-4',
            invalid &&
              'border-destructive focus-within:border-destructive focus-within:ring-destructive/15',
            className,
          )}
        >
          <label htmlFor={inputId} className="text-ink-subtle w-9 shrink-0 text-[13px]">
            {label}
          </label>
          <input
            id={inputId}
            role="combobox"
            aria-expanded={showList}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={
              showList && activeItem ? `${listId}-${getKey(activeItem)}` : undefined
            }
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            autoComplete="off"
            autoFocus={autoFocus}
            placeholder={placeholder}
            value={inputValue}
            onChange={(event) => {
              if (value) onChange(null)
              onQueryChange(event.target.value)
              setActive(0)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            className="placeholder:text-ink-tertiary min-w-0 flex-1 bg-transparent text-[15px] tracking-[-0.1px] outline-none"
          />
          {status === 'loading' ? (
            <LoaderCircleIcon aria-hidden className="text-primary size-4 animate-spin" />
          ) : null}
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        sideOffset={6}
        onOpenAutoFocus={(event) => event.preventDefault()}
        // Focus stays where the person put it (closing must not steal focus from the next field).
        onCloseAutoFocus={(event) => event.preventDefault()}
        onInteractOutside={(event) => {
          if ((event.target as HTMLElement | null)?.id === inputId) event.preventDefault()
        }}
        className="border-hairline-strong bg-surface-2 w-(--radix-popper-anchor-width) rounded-xl p-1.5 data-[state=closed]:pointer-events-none"
      >
        <ul
          id={listId}
          role="listbox"
          aria-label={`${label} suggestions`}
          className="max-h-72 overflow-y-auto"
        >
          {status === 'error' ? (
            <li className="text-destructive px-3 py-2.5 text-sm">{errorText}</li>
          ) : null}
          {status !== 'error' && items.length === 0 ? (
            <li className="text-ink-subtle px-3 py-2.5 text-sm">
              {status === 'loading' ? 'Searching…' : emptyText}
            </li>
          ) : null}
          {items.map((item, index) => (
            <li
              key={getKey(item)}
              id={`${listId}-${getKey(item)}`}
              role="option"
              aria-selected={index === active}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActive(index)}
              onClick={() => choose(item)}
              className={cn(
                'cursor-pointer rounded-lg px-3 py-2.5 text-sm transition-colors',
                index === active ? 'bg-surface-3 text-ink' : 'text-ink-muted',
              )}
            >
              {renderItem ? renderItem(item) : getLabel(item)}
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
