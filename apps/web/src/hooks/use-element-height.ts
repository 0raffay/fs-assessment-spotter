import { useCallback, useState, type RefCallback } from 'react'

/**
 * Tracks an element's rendered height (border box, px). Attach the returned callback ref to any
 * element; switching elements (e.g. a chip that becomes a panel) re-measures. 0 until measured and
 * after the element unmounts.
 */
export function useElementHeight<T extends HTMLElement>(): [RefCallback<T>, number] {
  const [height, setHeight] = useState(0)

  const ref = useCallback<RefCallback<T>>((node) => {
    if (!node) return
    const measure = () => setHeight(Math.round(node.getBoundingClientRect().height))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => {
      observer.disconnect()
      setHeight(0)
    }
  }, [])

  return [ref, height]
}
