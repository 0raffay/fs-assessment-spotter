import { createContext, useContext } from 'react'

/**
 * A typed React context. Returns the provider, a strict hook typed as `T` that throws a clear error
 * outside the provider, and an optional hook (`T | null`) for components that also work without it.
 */
export function createStrictContext<T>(name: string) {
  const Context = createContext<T | undefined>(undefined)
  Context.displayName = name

  function useStrictContext(): T {
    const value = useContext(Context)
    if (value === undefined) {
      throw new Error(`use${name} must be used inside <${name}Provider>`)
    }
    return value
  }

  function useOptionalContext(): T | null {
    return useContext(Context) ?? null
  }

  return [Context.Provider, useStrictContext, useOptionalContext] as const
}
