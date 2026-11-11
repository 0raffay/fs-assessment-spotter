import { XIcon } from 'lucide-react'
import { useId } from 'react'

import { IconButton } from '@/components/icon-button'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { HEATMAP_MEASURES, type HeatmapMeasure } from '@/features/forecast'
import type { Basemap, MapLayerVisibility } from '@/features/map'
import { cn } from '@/lib/utils'

import { useMapTools } from '../context/map-tools-store'

const MEASURE_LABELS: Record<HeatmapMeasure, string> = {
  risk: 'Risk',
  wind: 'Wind',
  rain: 'Rain',
  snow: 'Snow',
}

const LAYER_LABELS: Record<keyof MapLayerVisibility, string> = {
  alternateRoutes: 'Alternate routes',
  checkpoints: 'Checkpoints',
  routeNumbers: 'Route numbers',
  placeLabels: 'Place labels',
}

const BASEMAP_OPTIONS: readonly { id: Basemap; label: string; swatch: string }[] = [
  { id: 'auto', label: 'Theme', swatch: 'bg-[linear-gradient(135deg,#0b0d12_50%,#e6e9ee_50%)]' },
  { id: 'dark', label: 'Dark', swatch: 'bg-[#0b0d12] border border-hairline' },
  { id: 'light', label: 'Light', swatch: 'bg-[#e6e9ee]' },
  { id: 'terrain', label: 'Terrain', swatch: 'bg-[#d9e4d2]' },
]

const SEGMENT_ITEM =
  'text-ink-subtle hover:bg-surface-3 hover:text-ink data-[state=on]:bg-surface-4 data-[state=on]:text-ink h-[34px] rounded-[11px] text-[13px] font-medium transition-[background-color,color,transform] active:scale-[0.97] data-[state=on]:shadow-[0_2px_8px_rgb(0_0_0/0.35)]'

/** Heatmap measure and opacity, which layers show, and the basemap (DESIGN.md › layers-panel). */
export function LayersPanel() {
  const { heatmap, setHeatmap, layers, setLayer, basemap, setBasemap, closePanel } = useMapTools()
  const id = useId()

  return (
    <div className="flex flex-col gap-[18px] p-[18px]">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium tracking-[-0.2px]">Map layers</h2>
        <IconButton
          label="Close map layers"
          onClick={closePanel}
          icon={<XIcon className="size-4" />}
          className="text-ink-subtle size-[34px] rounded-xl"
        />
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label htmlFor={`${id}-heatmap`} className="text-sm">
            Weather heatmap
          </label>
          <Switch
            id={`${id}-heatmap`}
            checked={heatmap.visible}
            onCheckedChange={(checked) => setHeatmap('visible', checked)}
          />
        </div>
        <ToggleGroup
          type="single"
          value={heatmap.measure}
          onValueChange={(next) => {
            const measure = HEATMAP_MEASURES.find((m) => m === next)
            if (measure) setHeatmap('measure', measure)
          }}
          disabled={!heatmap.visible}
          aria-label="Heatmap shows"
          className="bg-surface-2 grid w-full grid-cols-4 gap-0.5 rounded-[14px] p-[3px]"
        >
          {HEATMAP_MEASURES.map((measure) => (
            <ToggleGroupItem key={measure} value={measure} className={SEGMENT_ITEM}>
              {MEASURE_LABELS[measure]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <div className="flex items-center gap-3">
          <span id={`${id}-opacity`} className="text-ink-subtle w-14 text-[13px]">
            Opacity
          </span>
          <Slider
            aria-labelledby={`${id}-opacity`}
            min={20}
            max={150}
            step={10}
            value={[Math.round(heatmap.opacity * 100)]}
            onValueChange={([value]) => value !== undefined && setHeatmap('opacity', value / 100)}
            disabled={!heatmap.visible}
            className="[&_[data-slot=slider-thumb]]:bg-ink [&_[data-slot=slider-track]]:bg-surface-4 flex-1 [&_[data-slot=slider-thumb]]:size-4 [&_[data-slot=slider-thumb]]:border-0"
          />
          <span className="text-ink-muted w-10 text-right text-[13px] tabular-nums">
            {Math.round(heatmap.opacity * 100)}%
          </span>
        </div>
      </section>

      <section
        className="border-hairline flex flex-col gap-1 border-t pt-3.5"
        aria-label="On the map"
      >
        <span className="text-ink-subtle pb-1 text-[13px]">On the map</span>
        {(Object.keys(LAYER_LABELS) as (keyof MapLayerVisibility)[]).map((key) => (
          <div key={key} className="flex h-[38px] items-center justify-between">
            <label htmlFor={`${id}-${key}`} className="text-ink-muted text-sm">
              {LAYER_LABELS[key]}
            </label>
            <Switch
              id={`${id}-${key}`}
              checked={layers[key]}
              onCheckedChange={(checked) => setLayer(key, checked)}
            />
          </div>
        ))}
      </section>

      <section className="border-hairline flex flex-col gap-2.5 border-t pt-3.5">
        <span id={`${id}-basemap`} className="text-ink-subtle text-[13px]">
          Basemap
        </span>
        <div role="radiogroup" aria-labelledby={`${id}-basemap`} className="grid grid-cols-4 gap-2">
          {BASEMAP_OPTIONS.map((option) => {
            const selected = option.id === basemap
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setBasemap(option.id)}
                className={cn(
                  'flex flex-col gap-1.5 rounded-2xl border p-1 pb-1.5 text-xs transition-[border-color,background-color,transform] outline-none active:scale-[0.97]',
                  'focus-visible:ring-ring/45 hover:bg-surface-2 focus-visible:ring-3',
                  selected ? 'border-primary text-ink' : 'border-hairline-strong text-ink-subtle',
                )}
              >
                <span className={cn('h-10 rounded-xl', option.swatch)} />
                {option.label}
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}
