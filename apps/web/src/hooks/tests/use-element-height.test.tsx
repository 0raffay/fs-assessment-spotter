import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useElementHeight } from '../use-element-height'

let resize: (() => void) | undefined
const disconnect = vi.fn()

class FakeResizeObserver {
  constructor(callback: () => void) {
    resize = callback
  }
  observe() {}
  unobserve() {}
  disconnect = disconnect
}

function Probe({ show, height }: { show: boolean; height: { value: number } }) {
  const [ref, measured] = useElementHeight<HTMLDivElement>()
  return (
    <>
      {show ? (
        <div
          ref={(node) => {
            if (node) node.getBoundingClientRect = () => ({ height: height.value }) as DOMRect
            return ref(node)
          }}
        />
      ) : null}
      <output data-testid="height">{measured}</output>
    </>
  )
}

describe('useElementHeight', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('measures on attach, follows resizes and resets on unmount', () => {
    vi.stubGlobal('ResizeObserver', FakeResizeObserver)
    const height = { value: 245 }
    const { rerender } = render(<Probe show height={height} />)
    expect(screen.getByTestId('height')).toHaveTextContent('245')

    height.value = 42
    act(() => resize?.())
    expect(screen.getByTestId('height')).toHaveTextContent('42')

    rerender(<Probe show={false} height={height} />)
    expect(screen.getByTestId('height')).toHaveTextContent('0')
    expect(disconnect).toHaveBeenCalled()
  })
})
