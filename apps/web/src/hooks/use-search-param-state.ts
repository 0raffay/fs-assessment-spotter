import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import type { z } from 'zod'

function encode(value: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(value))
  let binary = ''
  bytes.forEach((byte) => (binary += String.fromCharCode(byte)))
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function decode(raw: string): unknown {
  try {
    const binary = atob(raw.replace(/-/g, '+').replace(/_/g, '/'))
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
    return JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    return undefined
  }
}

/**
 * A piece of typed state stored in one URL search param (as base64url JSON), validated with a zod
 * schema on the way in. Invalid or missing values read as `null`, so a hand-edited URL can't crash
 * the app. Shareable and survives reloads.
 */
export function useSearchParamState<TSchema extends z.ZodType>(
  key: string,
  schema: TSchema,
): readonly [z.output<TSchema> | null, (value: z.input<TSchema> | null) => void] {
  const [params, setParams] = useSearchParams()
  const raw = params.get(key)

  const value = useMemo(() => {
    if (!raw) return null
    const parsed = schema.safeParse(decode(raw))
    return parsed.success ? (parsed.data as z.output<TSchema>) : null
  }, [raw, schema])

  const setValue = useCallback(
    (next: z.input<TSchema> | null) => {
      setParams(
        (current) => {
          const copy = new URLSearchParams(current)
          if (next === null) copy.delete(key)
          else copy.set(key, encode(next))
          return copy
        },
        { replace: false },
      )
    },
    [key, setParams],
  )

  return [value, setValue] as const
}

export const searchParamCodec = { encode, decode }
