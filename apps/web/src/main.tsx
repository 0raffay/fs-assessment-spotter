import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from '@/app/app'
import { env } from '@/lib/env'
import './index.css'

/** With mocks on, MSW answers API calls before the app's first request. */
async function enableMocking(): Promise<void> {
  if (!env.VITE_ENABLE_MOCKS) return
  const { startMockWorker } = await import('@/mocks/browser')
  await startMockWorker()
}

void enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
