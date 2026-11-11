import { createStrictContext } from '@/lib/create-strict-context'

import type { ForecastState } from '../types'

export const [ForecastContextProvider, useForecast, useOptionalForecast] =
  createStrictContext<ForecastState>('Forecast')
