import { AnimatePresence, motion } from 'motion/react'
import { CheckIcon, ShareIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { DURATION, EASE_OUT } from '@/lib/motion'
import { cn } from '@/lib/utils'

/** How long the button reads "Copied" before returning to "Share". */
export const COPIED_RESET_MS = 2000

const ICON = 'size-[15px]'

/** Copies the current URL (which encodes the trip) to the clipboard, and says so on the button. */
export function ShareButton({
  disabled,
  compact = false,
}: {
  disabled: boolean
  compact?: boolean
}) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), COPIED_RESET_MS)
    return () => window.clearTimeout(timer)
  }, [copied])

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      toast.success('Link copied', { description: 'Anyone with the link sees this trip.' })
    } catch {
      setCopied(false)
      toast.error('Couldn’t copy the link', {
        description: 'Copy it from the address bar instead.',
      })
    }
  }

  const label = copied ? 'Copied' : 'Share'

  return (
    <Button
      variant="outline"
      disabled={disabled}
      onClick={() => void share()}
      data-state={copied ? 'copied' : 'idle'}
      className={cn(
        'h-10 rounded-full px-4 font-normal transition-[background-color,border-color,color,transform] active:scale-95',
        copied &&
          'border-risk-low/45 bg-risk-low/10 text-risk-low hover:bg-risk-low/15 hover:text-risk-low',
      )}
    >
      <span className="relative grid size-[15px] place-items-center">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={label}
            initial={{ opacity: 0, scale: 0.6, rotate: copied ? -45 : 0 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: DURATION.toggle, ease: EASE_OUT }}
            className="absolute inset-0 grid place-items-center"
          >
            {copied ? (
              <CheckIcon className={ICON} strokeWidth={2.25} />
            ) : (
              <ShareIcon className={ICON} strokeWidth={1.75} />
            )}
          </motion.span>
        </AnimatePresence>
      </span>
      {compact ? <span className="sr-only">{label}</span> : <span>{label}</span>}
    </Button>
  )
}
