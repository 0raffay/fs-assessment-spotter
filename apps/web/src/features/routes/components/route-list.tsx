import { motion } from 'motion/react'
import { ArrowDownWideNarrowIcon, InfoIcon } from 'lucide-react'

import { useRouteSelection } from '../context/route-selection-store'
import type { RouteListVariant } from '../types'

import { RouteCard } from './route-card'

/** The three routes, ranked (routes[0] is the recommendation). */
export function RouteList({
  variant = 'full',
  compact = false,
}: {
  variant?: RouteListVariant
  compact?: boolean
}) {
  const { plan, selectedRoute, selectRoute } = useRouteSelection()
  const routes = variant === 'peek' ? [selectedRoute] : plan.routes

  return (
    <section aria-label="Route options" className="flex flex-col gap-3">
      {variant === 'full' ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-medium tracking-[-0.2px]">Routes</h2>
            <span className="bg-surface-3 text-ink-muted rounded-full px-2 py-0.5 text-xs tabular-nums">
              {plan.routes.length}
            </span>
          </div>
          <span className="text-ink-subtle flex items-center gap-1.5 text-[13px]">
            <ArrowDownWideNarrowIcon className="size-3.5" strokeWidth={1.75} />
            Safest first
          </span>
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        {routes.map((route, index) => (
          <motion.div
            key={route.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.06, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <RouteCard
              route={route}
              selected={route.id === selectedRoute.id}
              onSelect={() => selectRoute(route.id)}
              reasons={route.isRecommended && variant === 'full' ? plan.reasons : undefined}
              compact={compact}
            />
          </motion.div>
        ))}
      </div>

      {variant === 'peek' ? (
        <p className="text-ink-subtle text-center text-[13px]">
          {plan.routes.length - 1} more routes · drag up to compare
        </p>
      ) : (
        <p className="text-ink-subtle flex gap-2 text-xs leading-relaxed">
          <InfoIcon className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.75} />
          Ranked by No Travel and severe miles, then high miles, average risk and drive time.
        </p>
      )}
    </section>
  )
}
