import { useState } from 'react'

import { SearchCombobox, type SearchStatus } from '@/components/search-combobox'
import type { Place } from '@/types'

import { usePlaceSearch } from '../api/trip-planner.api'

interface PlaceFieldProps {
  id: string
  label: string
  value: Place | null
  onChange: (place: Place | null) => void
  invalid?: boolean
  describedBy?: string
  autoFocus?: boolean
}

const placeLabel = (place: Place) => `${place.name}, ${place.region}`

/** Location search for origin/destination, backed by `GET /geocode/`. */
export function PlaceField({
  id,
  label,
  value,
  onChange,
  invalid,
  describedBy,
  autoFocus,
}: PlaceFieldProps) {
  const [query, setQuery] = useState('')
  const search = usePlaceSearch(query)

  const status: SearchStatus = search.isError
    ? 'error'
    : search.isTyping || search.isFetching
      ? 'loading'
      : search.isIdle
        ? 'idle'
        : 'success'

  return (
    <SearchCombobox<Place>
      id={id}
      label={label}
      placeholder="City, address or ZIP"
      value={value}
      onChange={onChange}
      query={query}
      onQueryChange={setQuery}
      items={search.data ?? []}
      status={status}
      getKey={(place) => place.id}
      getLabel={placeLabel}
      renderItem={(place) => (
        <span className="flex items-baseline justify-between gap-3">
          <span className="text-ink">{place.name}</span>
          <span className="text-ink-subtle text-[13px]">{place.region}</span>
        </span>
      )}
      emptyText="No places match"
      invalid={invalid}
      describedBy={describedBy}
      autoFocus={autoFocus}
    />
  )
}
