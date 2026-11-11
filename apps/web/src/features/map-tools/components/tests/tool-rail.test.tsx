import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '@/tests/render'

import type { ToolDefinition } from '../../types'
import { ToolRail } from '../tool-rail'

type Id = 'a' | 'b' | 'c'

function tools(onSelect: (id: Id) => void): ToolDefinition<Id>[] {
  return [
    { id: 'a', label: 'Alpha', icon: <span />, pressed: true, onSelect: () => onSelect('a') },
    { id: 'b', label: 'Beta', icon: <span />, onSelect: () => onSelect('b') },
    {
      id: 'c',
      label: 'Gamma',
      icon: <span />,
      disabled: true,
      separated: true,
      onSelect: () => onSelect('c'),
    },
  ]
}

describe('ToolRail', () => {
  it('renders a labelled vertical toolbar with pressed and disabled states', () => {
    renderWithProviders(<ToolRail tools={tools(() => undefined)} />)
    const toolbar = screen.getByRole('toolbar', { name: 'Map tools' })
    expect(toolbar).toHaveAttribute('aria-orientation', 'vertical')
    expect(screen.getByRole('button', { name: 'Alpha' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Gamma' })).toBeDisabled()
  })

  it('calls the tool handler with its typed id', async () => {
    const onSelect = vi.fn<(id: Id) => void>()
    const { user } = renderWithProviders(<ToolRail tools={tools(onSelect)} />)
    await user.click(screen.getByRole('button', { name: 'Beta' }))
    await user.click(screen.getByRole('button', { name: 'Gamma' }))
    expect(onSelect).toHaveBeenCalledExactlyOnceWith('b')
  })
})
