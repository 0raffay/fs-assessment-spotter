import { z } from 'zod'

import { zonedDateTimeToIso } from '@/lib/time'
import {
  checkpointIntervalSchema,
  MAX_LOAD_WEIGHT_LB,
  placeSchema,
  type CheckpointInterval,
  type Place,
  type TripRequest,
} from '@/types'

/** How far in the past a departure may be (clock drift, slow typing). */
const PAST_TOLERANCE_MS = 30 * 60_000

/** The trip form. Input allows empty fields; output is complete and checked. */
export const tripFormSchema = z
  .object({
    origin: placeSchema.nullable(),
    destination: placeSchema.nullable(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a date'),
    time: z.string().regex(/^\d{2}:\d{2}$/, 'Pick a time'),
    loadWeightLb: z
      .number({ error: 'Enter the load weight' })
      .int('Use whole pounds')
      .positive('Load must be more than 0 lb')
      .max(
        MAX_LOAD_WEIGHT_LB,
        `Load can’t be more than ${MAX_LOAD_WEIGHT_LB.toLocaleString('en-US')} lb`,
      )
      .nullable(),
    intervalMiles: checkpointIntervalSchema,
  })
  .superRefine((values, ctx) => {
    if (!values.origin)
      ctx.addIssue({ code: 'custom', path: ['origin'], message: 'Choose where the trip starts' })
    if (!values.destination)
      ctx.addIssue({ code: 'custom', path: ['destination'], message: 'Choose where the trip ends' })
    if (values.loadWeightLb === null)
      ctx.addIssue({ code: 'custom', path: ['loadWeightLb'], message: 'Enter the load weight' })
    if (values.origin && values.destination && values.origin.id === values.destination.id) {
      ctx.addIssue({
        code: 'custom',
        path: ['destination'],
        message: 'Destination must differ from the origin',
      })
    }
    if (
      values.origin &&
      /^\d{4}-\d{2}-\d{2}$/.test(values.date) &&
      /^\d{2}:\d{2}$/.test(values.time)
    ) {
      const departure = new Date(
        zonedDateTimeToIso(values.date, values.time, values.origin.timeZone),
      )
      if (departure.getTime() < Date.now() - PAST_TOLERANCE_MS) {
        ctx.addIssue({ code: 'custom', path: ['time'], message: 'Departure is in the past' })
      }
    }
  })
  .transform((values): TripFormOutput => ({
    origin: values.origin as Place,
    destination: values.destination as Place,
    date: values.date,
    time: values.time,
    loadWeightLb: values.loadWeightLb as number,
    intervalMiles: values.intervalMiles,
  }))

/** Form values while editing (ids keep their brand: the schemas use `.brand<…, 'inout'>()`). */
export type TripFormInput = z.input<typeof tripFormSchema>

export interface TripFormOutput {
  origin: Place
  destination: Place
  date: string
  time: string
  loadWeightLb: number
  intervalMiles: CheckpointInterval
}

export function toTripRequest(values: TripFormOutput): TripRequest {
  return {
    origin: values.origin,
    destination: values.destination,
    departureAt: zonedDateTimeToIso(values.date, values.time, values.origin.timeZone),
    loadWeightLb: values.loadWeightLb,
    intervalMiles: values.intervalMiles,
  }
}

/** Phone sheet heights (DESIGN.md › Handheld shell). */
export const SHEET_SNAPS = ['peek', 'half', 'full'] as const
export type SheetSnap = (typeof SHEET_SNAPS)[number]

export interface TripPlannerState {
  /** The planned trip, read from the URL (`?trip=`). */
  request: TripRequest | null
  submit: (request: TripRequest) => void
  /** Form shown instead of the summary. True whenever there is no trip. */
  isEditing: boolean
  startEditing: () => void
  cancelEditing: () => void
  /** Desktop panel open/collapsed. */
  isPanelOpen: boolean
  setPanelOpen: (open: boolean) => void
  /** Handheld sheet height. */
  sheetSnap: SheetSnap
  setSheetSnap: (snap: SheetSnap) => void
}
