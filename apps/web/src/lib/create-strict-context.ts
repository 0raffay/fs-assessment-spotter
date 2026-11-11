import { createContext, useContext } from 'react'

/**
 * A React context that must be used inside its provider. Returns the provider and a hook typed as
 * `T` (never `T | undefined`), and the hook throws a clear error if the provider is missing.
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

  return [Context.Provider, useStrictContext] as const
}
