import type { LngLat, Place } from '@/types'

import { haversineMiles } from './geo'

type Row = readonly [name: string, region: string, lng: number, lat: number, timeZone: string]

const ROWS: readonly Row[] = [
  ['Dallas', 'TX', -96.797, 32.7767, 'America/Chicago'],
  ['Fort Worth', 'TX', -97.3308, 32.7555, 'America/Chicago'],
  ['Houston', 'TX', -95.3698, 29.7604, 'America/Chicago'],
  ['San Antonio', 'TX', -98.4936, 29.4241, 'America/Chicago'],
  ['Austin', 'TX', -97.7431, 30.2672, 'America/Chicago'],
  ['El Paso', 'TX', -106.485, 31.7619, 'America/Denver'],
  ['Amarillo', 'TX', -101.8313, 35.222, 'America/Chicago'],
  ['Lubbock', 'TX', -101.8552, 33.5779, 'America/Chicago'],
  ['Wichita Falls', 'TX', -98.4934, 33.9137, 'America/Chicago'],
  ['Oklahoma City', 'OK', -97.5164, 35.4676, 'America/Chicago'],
  ['Tulsa', 'OK', -95.9928, 36.154, 'America/Chicago'],
  ['Wichita', 'KS', -97.3301, 37.6872, 'America/Chicago'],
  ['Salina', 'KS', -97.6114, 38.8403, 'America/Chicago'],
  ['Hays', 'KS', -99.3268, 38.8792, 'America/Chicago'],
  ['Kansas City', 'MO', -94.5786, 39.0997, 'America/Chicago'],
  ['St. Louis', 'MO', -90.1994, 38.627, 'America/Chicago'],
  ['Denver', 'CO', -104.9903, 39.7392, 'America/Denver'],
  ['Pueblo', 'CO', -104.6091, 38.2544, 'America/Denver'],
  ['Colorado Springs', 'CO', -104.8214, 38.8339, 'America/Denver'],
  ['Limon', 'CO', -103.6922, 39.2639, 'America/Denver'],
  ['Raton', 'NM', -104.4391, 36.9034, 'America/Denver'],
  ['Albuquerque', 'NM', -106.6504, 35.0844, 'America/Denver'],
  ['Santa Fe', 'NM', -105.9378, 35.687, 'America/Denver'],
  ['Phoenix', 'AZ', -112.074, 33.4484, 'America/Phoenix'],
  ['Flagstaff', 'AZ', -111.6513, 35.1983, 'America/Phoenix'],
  ['Las Vegas', 'NV', -115.1398, 36.1699, 'America/Los_Angeles'],
  ['Salt Lake City', 'UT', -111.891, 40.7608, 'America/Denver'],
  ['Cheyenne', 'WY', -104.8202, 41.14, 'America/Denver'],
  ['Omaha', 'NE', -95.9345, 41.2565, 'America/Chicago'],
  ['North Platte', 'NE', -100.7654, 41.1403, 'America/Chicago'],
  ['Des Moines', 'IA', -93.6091, 41.5868, 'America/Chicago'],
  ['Chicago', 'IL', -87.6298, 41.8781, 'America/Chicago'],
  ['Minneapolis', 'MN', -93.265, 44.9778, 'America/Chicago'],
  ['Memphis', 'TN', -90.049, 35.1495, 'America/Chicago'],
  ['Nashville', 'TN', -86.7816, 36.1627, 'America/Chicago'],
  ['Little Rock', 'AR', -92.2896, 34.7465, 'America/Chicago'],
  ['Shreveport', 'LA', -93.7502, 32.5252, 'America/Chicago'],
  ['New Orleans', 'LA', -90.0715, 29.9511, 'America/Chicago'],
  ['Atlanta', 'GA', -84.388, 33.749, 'America/New_York'],
  ['Indianapolis', 'IN', -86.1581, 39.7684, 'America/Indiana/Indianapolis'],
  ['Los Angeles', 'CA', -118.2437, 34.0522, 'America/Los_Angeles'],
  ['Sacramento', 'CA', -121.4944, 38.5816, 'America/Los_Angeles'],
  ['Seattle', 'WA', -122.3321, 47.6062, 'America/Los_Angeles'],
  ['Portland', 'OR', -122.6765, 45.5152, 'America/Los_Angeles'],
  ['Boise', 'ID', -116.2023, 43.615, 'America/Boise'],
]

export const PLACES: readonly Place[] = ROWS.map(([name, region, lng, lat, timeZone]) => ({
  id: `place:${name.toLowerCase().replace(/[^a-z]+/g, '-')}-${region.toLowerCase()}` as Place['id'],
  name,
  region,
  coordinates: [lng, lat] as LngLat,
  timeZone,
}))

/** Case-insensitive search on "name, region", best matches (prefix) first. */
export function searchPlaces(query: string, limit = 6): Place[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const scored = PLACES.map((place) => {
    const label = `${place.name}, ${place.region}`.toLowerCase()
    const score = label.startsWith(q)
      ? 0
      : place.name
            .toLowerCase()
            .split(' ')
            .some((w) => w.startsWith(q))
        ? 1
        : label.includes(q)
          ? 2
          : -1
    return { place, score }
  }).filter((item) => item.score >= 0)
  scored.sort((a, b) => a.score - b.score || a.place.name.localeCompare(b.place.name))
  return scored.slice(0, limit).map((item) => item.place)
}

export function nearestPlace(coordinates: LngLat, exclude: readonly Place['id'][] = []): Place {
  let best: Place | undefined
  let bestDistance = Infinity
  for (const place of PLACES) {
    if (exclude.includes(place.id)) continue
    const distance = haversineMiles(coordinates, place.coordinates)
    if (distance < bestDistance) {
      best = place
      bestDistance = distance
    }
  }
  if (!best) throw new Error('No places available')
  return best
}

export function findPlace(id: string): Place | undefined {
  return PLACES.find((place) => place.id === id)
}
