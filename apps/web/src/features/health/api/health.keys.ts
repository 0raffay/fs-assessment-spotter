/** TanStack Query keys for the health feature. */
export const healthKeys = {
  all: ['health'] as const,
  status: () => [...healthKeys.all, 'status'] as const,
}
