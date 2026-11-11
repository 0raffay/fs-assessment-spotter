import { createStrictContext } from '@/lib/create-strict-context'

import type { MapToolsState } from '../types'

export const [MapToolsContextProvider, useMapTools, useOptionalMapTools] =
  createStrictContext<MapToolsState>('MapTools')
