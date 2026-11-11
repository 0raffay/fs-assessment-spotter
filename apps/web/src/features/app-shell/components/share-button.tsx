import { ShareIcon } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

/** Copies the current URL (which encodes the trip) to the clipboard. */
export function ShareButton({
  disabled,
  compact = false,
}: {
  disabled: boolean
  compact?: boolean
}) {
  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied', { description: 'Anyone with the link sees this trip.' })
    } catch {
      toast.error('Couldn’t copy the link', {
        description: 'Copy it from the address bar instead.',
      })
    }
  }

  return (
    <Button
      variant="outline"
      disabled={disabled}
      onClick={() => void share()}
      className="h-10 rounded-full px-4 font-normal transition-[background-color,border-color,transform] active:scale-95"
    >
      <ShareIcon className="size-[15px]" strokeWidth={1.75} />
      {compact ? null : 'Share'}
      {compact ? <span className="sr-only">Share</span> : null}
    </Button>
  )
}
