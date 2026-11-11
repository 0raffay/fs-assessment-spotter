import { useId } from 'react'

import { USGS_HYBRID_TILES, type Basemap } from '@/features/map'
import { cn } from '@/lib/utils'

type DrawnStyle = 'dark' | 'light' | 'terrain'

interface Palette {
  land: string
  water: string
  park: string
  minor: string
  major: string
  /** Outline under the highway, so it reads on pale land. */
  casing: string
  city: string
}

/** Each CARTO style's own colors, simplified (Dark Matter, Positron, Voyager). */
const PALETTES: Record<DrawnStyle, Palette> = {
  dark: {
    land: '#1b1e24',
    water: '#0c0e12',
    park: '#1e2620',
    minor: '#2b2f37',
    major: '#454b57',
    casing: '#1b1e24',
    city: '#a3acba',
  },
  light: {
    land: '#f3f3f0',
    water: '#d2dce1',
    park: '#e2eadd',
    minor: '#ffffff',
    major: '#ffffff',
    casing: '#d6d6d2',
    city: '#6b7280',
  },
  terrain: {
    land: '#f6f1e6',
    water: '#a8cfe0',
    park: '#cde2c0',
    minor: '#ffffff',
    major: '#f6c15f',
    casing: '#e3a83c',
    city: '#6b5a44',
  },
}

/** A tiny drawn map: water, a park, side roads, a highway and a city dot (64×40 viewBox). */
function MiniMap({ palette }: { palette: Palette }) {
  return (
    <>
      <rect width="64" height="40" fill={palette.land} />
      <path d="M0 25 C10 21 17 30 27 28 C33 27 35 34 41 40 L0 40 Z" fill={palette.water} />
      <ellipse cx="50" cy="9" rx="11" ry="6.5" fill={palette.park} />
      <g stroke={palette.minor} strokeWidth="1.4" fill="none" strokeLinecap="round">
        <path d="M9 -2 L21 42" />
        <path d="M-2 14 L66 19" />
        <path d="M38 -2 L46 42" />
      </g>
      <path
        d="M-2 33 C18 21 34 17 66 6"
        stroke={palette.casing}
        strokeWidth="4.6"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M-2 33 C18 21 34 17 66 6"
        stroke={palette.major}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="47" cy="27" r="2.2" fill={palette.city} />
    </>
  )
}

/** One real imagery tile (Raton Pass area, zoom 11) for the satellite choice, like Google's. */
const SATELLITE_PREVIEW = USGS_HYBRID_TILES.replace('{z}', '11')
  .replace('{y}', '793')
  .replace('{x}', '428')

/**
 * A preview of a basemap for the layers panel. `auto` (the plain map, following the theme) shows
 * the dark and light maps split on the diagonal; `satellite` shows a real imagery tile.
 */
export function BasemapPreview({ basemap, className }: { basemap: Basemap; className?: string }) {
  return basemap === 'satellite' ? (
    <SatellitePreview className={className} />
  ) : (
    <DrawnPreview basemap={basemap} className={className} />
  )
}

function SatellitePreview({ className }: { className?: string | undefined }) {
  return (
    <span aria-hidden className={cn('block bg-[#4a5240]', className)}>
      <img
        src={SATELLITE_PREVIEW}
        alt=""
        loading="lazy"
        draggable={false}
        className="size-full object-cover"
        // The olive background stands in if the tile can't load.
        onError={(event) => {
          event.currentTarget.style.display = 'none'
        }}
      />
    </span>
  )
}

function DrawnPreview({
  basemap,
  className,
}: {
  basemap: Exclude<Basemap, 'satellite'>
  className?: string | undefined
}) {
  // useId() returns characters that need escaping inside url(#…); keep it to [a-z0-9-].
  const clipId = `basemap-clip-${useId().replace(/[^a-zA-Z0-9-]/g, '')}`

  return (
    <svg
      viewBox="0 0 64 40"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
      className={cn('block', className)}
    >
      {basemap === 'auto' ? (
        <>
          <clipPath id={clipId}>
            <polygon points="0,0 64,0 0,40" />
          </clipPath>
          <MiniMap palette={PALETTES.light} />
          <g clipPath={`url(#${clipId})`}>
            <MiniMap palette={PALETTES.dark} />
          </g>
          <path d="M64 0 L0 40" stroke="rgb(0 0 0 / 0.25)" strokeWidth="0.6" />
        </>
      ) : (
        <MiniMap palette={PALETTES[basemap]} />
      )}
    </svg>
  )
}
