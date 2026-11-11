import { defineEndpoint } from '@/lib/api'
import { tripPlanSchema, tripRequestSchema } from '@/types'

/** `POST /api/routes/plan/` — three ranked routes with weather risk (docs/api-contract.md). */
export const planTripEndpoint = defineEndpoint({
  method: 'POST',
  path: '/routes/plan/',
  body: tripRequestSchema,
  response: tripPlanSchema,
})
