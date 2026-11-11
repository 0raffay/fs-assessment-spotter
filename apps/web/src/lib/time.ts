/** Date/time helpers that work in a named IANA time zone without extra libraries. */

/** Minutes that `timeZone` is ahead of UTC at instant `timestamp`. */
function zoneOffsetMinutes(timestamp: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(timestamp)
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0)
  const asUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
    get('second'),
  )
  return Math.round((asUtc - timestamp) / 60_000)
}

/** `2026-11-12` + `06:00` in `America/Chicago` → `2026-11-12T12:00:00.000Z`. */
export function zonedDateTimeToIso(date: string, time: string, timeZone: string): string {
  const [year = 0, month = 1, day = 1] = date.split('-').map(Number)
  const [hour = 0, minute = 0] = time.split(':').map(Number)
  const wallClock = Date.UTC(year, month - 1, day, hour, minute)
  let instant = wallClock - zoneOffsetMinutes(wallClock, timeZone) * 60_000
  // Second pass corrects the offset across DST changes.
  instant = wallClock - zoneOffsetMinutes(instant, timeZone) * 60_000
  return new Date(instant).toISOString()
}

/** The reverse: an instant as `{ date, time }` wall-clock strings in `timeZone`. */
export function isoToZonedParts(iso: string, timeZone: string): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(new Date(iso))
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '00'
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${get('hour')}:${get('minute')}`,
  }
}

/** The browser's own time zone. */
export function localTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

/** Tomorrow at `time` in `timeZone`, as `{ date, time }`. */
export function tomorrowAt(
  time: string,
  timeZone: string,
  now: Date = new Date(),
): { date: string; time: string } {
  const tomorrow = new Date(now.getTime() + 24 * 3_600_000)
  return { date: isoToZonedParts(tomorrow.toISOString(), timeZone).date, time }
}
