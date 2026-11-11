import {
  ChartLineIcon,
  ClockIcon,
  LayersIcon,
  ListIcon,
  MaximizeIcon,
  MinusIcon,
  PaletteIcon,
  PlusIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useMap } from 'react-map-gl/maplibre'

import { useOptionalForecast } from '@/features/forecast'
import { routesBounds, TRIP_MAP_ID, type MapPadding } from '@/features/map'
import { useOptionalRouteSelection } from '@/features/routes'

import { useMapTools } from '../context/map-tools-store'
import type { MapPanel, ToolDefinition } from '../types'

import { ToolRail } from './tool-rail'

type ToolId = MapPanel | 'forecast' | 'fit' | 'zoom-in' | 'zoom-out'

const ICON = 'size-[18px]'

/** The concrete rail: panels, forecast toggle, fit and zoom. Phones get a shorter rail. */
export function MapToolRail({ compact, fitPadding }: { compact: boolean; fitPadding: MapPadding }) {
  const { activePanel, togglePanel } = useMapTools()
  const forecast = useOptionalForecast()
  const selection = useOptionalRouteSelection()
  const map = useMap()[TRIP_MAP_ID]
  const disabled = !selection

  const panel = (id: MapPanel, label: string, icon: ReactNode): ToolDefinition<ToolId> => ({
    id,
    label,
    icon,
    pressed: activePanel === id,
    disabled,
    onSelect: () => togglePanel(id),
  })

  const tools: ToolDefinition<ToolId>[] = [
    panel('layers', 'Map layers', <LayersIcon className={ICON} strokeWidth={1.75} />),
    {
      id: 'forecast',
      label: 'Forecast timeline',
      icon: <ClockIcon className={ICON} strokeWidth={1.75} />,
      pressed: forecast?.isOpen ?? false,
      disabled: disabled || !forecast,
      onSelect: () => forecast?.setOpen(!forecast.isOpen),
    },
    panel('legend', 'Legend', <PaletteIcon className={ICON} strokeWidth={1.75} />),
    panel('checkpoints', 'Checkpoint list', <ListIcon className={ICON} strokeWidth={1.75} />),
    ...(compact
      ? []
      : [panel('profile', 'Risk profile', <ChartLineIcon className={ICON} strokeWidth={1.75} />)]),
    {
      id: 'fit',
      label: 'Fit all routes',
      icon: <MaximizeIcon className={ICON} strokeWidth={1.75} />,
      separated: true,
      disabled,
      onSelect: () =>
        selection &&
        map?.fitBounds(routesBounds(selection.plan.routes), { padding: fitPadding, duration: 700 }),
    },
    ...(compact
      ? []
      : ([
          {
            id: 'zoom-in',
            label: 'Zoom in',
            icon: <PlusIcon className={ICON} strokeWidth={1.75} />,
            onSelect: () => map?.zoomIn(),
          },
          {
            id: 'zoom-out',
            label: 'Zoom out',
            icon: <MinusIcon className={ICON} strokeWidth={1.75} />,
            onSelect: () => map?.zoomOut(),
          },
        ] satisfies ToolDefinition<ToolId>[])),
  ]

  return <ToolRail tools={tools} large={compact} />
}
