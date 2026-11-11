import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowDownUpIcon, ArrowRightIcon } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { formatZone } from '@/lib/format'
import { isoToZonedParts, localTimeZone, tomorrowAt } from '@/lib/time'
import type { TripRequest } from '@/types'

import { useTripPlanner } from '../context/trip-planner-store'
import { toTripRequest, tripFormSchema, type TripFormInput, type TripFormOutput } from '../types'

import { DepartureFields } from './departure-fields'
import { FormField } from './form-field'
import { IntervalToggle } from './interval-toggle'
import { LoadWeightField } from './load-weight-field'
import { PlaceField } from './place-field'
import { RouteConnector } from './route-connector'

function defaultsFrom(request: TripRequest | null): TripFormInput {
  if (request) {
    const { date, time } = isoToZonedParts(request.departureAt, request.origin.timeZone)
    return {
      origin: request.origin,
      destination: request.destination,
      date,
      time,
      loadWeightLb: request.loadWeightLb,
      intervalMiles: request.intervalMiles,
    }
  }
  const { date, time } = tomorrowAt('06:00', localTimeZone())
  return { origin: null, destination: null, date, time, loadWeightLb: null, intervalMiles: 25 }
}

/** Origin, destination, departure, load and checkpoint interval (the PDF's inputs). */
export function TripForm({ compact = false }: { compact?: boolean }) {
  const { request, submit, cancelEditing } = useTripPlanner()
  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<TripFormInput, unknown, TripFormOutput>({
    resolver: zodResolver(tripFormSchema),
    defaultValues: defaultsFrom(request),
    mode: 'onTouched',
  })

  const origin = useWatch({ control, name: 'origin' })
  // A fixed instant for the zone abbreviation (CST/CDT), taken once when the form opens.
  const [openedAt] = useState(() => new Date().toISOString())
  const zoneLabel = formatZone(openedAt, origin?.timeZone ?? localTimeZone())

  function swap() {
    const { origin: from, destination: to } = getValues()
    setValue('origin', to, { shouldValidate: Boolean(errors.origin) })
    setValue('destination', from, { shouldValidate: Boolean(errors.destination) })
  }

  return (
    <form
      aria-label="Trip details"
      noValidate
      onSubmit={handleSubmit((values) => submit(toTripRequest(values)))}
      className="flex flex-col gap-[18px]"
    >
      <FormField
        label="Route"
        labelId="route-label"
        error={errors.origin?.message ?? errors.destination?.message}
        errorId="route-error"
      >
        <div className="flex items-stretch gap-2" role="group" aria-labelledby="route-label">
          <RouteConnector inset={compact ? 18 : 16} />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Controller
              control={control}
              name="origin"
              render={({ field }) => (
                <PlaceField
                  id="origin"
                  label="From"
                  value={field.value}
                  onChange={field.onChange}
                  invalid={Boolean(errors.origin)}
                  describedBy={errors.origin ? 'route-error' : undefined}
                  autoFocus={!request}
                />
              )}
            />
            <Controller
              control={control}
              name="destination"
              render={({ field }) => (
                <PlaceField
                  id="destination"
                  label="To"
                  value={field.value}
                  onChange={field.onChange}
                  invalid={Boolean(errors.destination)}
                  describedBy={errors.destination ? 'route-error' : undefined}
                />
              )}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={swap}
            aria-label="Swap origin and destination"
            className="text-ink-muted hover:bg-surface-3 size-9 self-center rounded-lg active:scale-95"
          >
            <ArrowDownUpIcon className="size-4" strokeWidth={1.75} />
          </Button>
        </div>
      </FormField>

      <FormField
        label="Departure"
        labelId="departure-label"
        error={errors.date?.message ?? errors.time?.message}
      >
        <Controller
          control={control}
          name="date"
          render={({ field: dateField }) => (
            <Controller
              control={control}
              name="time"
              render={({ field: timeField }) => (
                <DepartureFields
                  date={dateField.value}
                  time={timeField.value}
                  onDateChange={dateField.onChange}
                  onTimeChange={timeField.onChange}
                  zoneLabel={zoneLabel}
                  invalid={Boolean(errors.date ?? errors.time)}
                  labelledBy="departure-label"
                />
              )}
            />
          )}
        />
      </FormField>

      <FormField
        label="Load weight"
        htmlFor="load"
        error={errors.loadWeightLb?.message}
        errorId="load-error"
      >
        <Controller
          control={control}
          name="loadWeightLb"
          render={({ field }) => (
            <LoadWeightField
              id="load"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              invalid={Boolean(errors.loadWeightLb)}
              describedBy={errors.loadWeightLb ? 'load-error' : undefined}
            />
          )}
        />
      </FormField>

      <FormField label="Check the weather every" labelId="interval-label">
        <Controller
          control={control}
          name="intervalMiles"
          render={({ field }) => (
            <IntervalToggle
              value={field.value}
              onChange={field.onChange}
              labelledBy="interval-label"
            />
          )}
        />
      </FormField>

      <div className="flex gap-2">
        {request ? (
          <Button
            type="button"
            variant="ghost"
            onClick={cancelEditing}
            className="h-11 rounded-lg px-4"
          >
            Cancel
          </Button>
        ) : null}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-11 flex-1 rounded-lg text-[15px] transition-[background-color,box-shadow,transform] hover:shadow-[0_6px_20px_rgb(56_189_248/0.25)] active:scale-[0.98]"
        >
          Plan routes
          <ArrowRightIcon className="size-4" strokeWidth={1.75} />
        </Button>
      </div>
    </form>
  )
}
