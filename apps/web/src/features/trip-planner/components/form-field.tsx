import type { ReactNode } from 'react'

import { AnimatePresence, motion } from 'motion/react'

interface FormFieldProps {
  label: string
  htmlFor?: string
  labelId?: string
  error?: string
  errorId?: string
  children: ReactNode
}

/** Label above, control, then an animated error line (DESIGN.md: sentence-case labels). */
export function FormField({ label, htmlFor, labelId, error, errorId, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      {htmlFor ? (
        <label htmlFor={htmlFor} id={labelId} className="text-ink-subtle text-[13px]">
          {label}
        </label>
      ) : (
        <span id={labelId} className="text-ink-subtle text-[13px]">
          {label}
        </span>
      )}
      {children}
      <AnimatePresence initial={false}>
        {error ? (
          <motion.p
            key="error"
            id={errorId}
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-destructive text-[13px]"
          >
            {error}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
