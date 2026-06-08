import { describe, it, expect, afterEach } from 'vitest'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import XrGutter from 'src/components/XrGutter'

const mountIn = (component) => {
  const node = document.createElement('div')
  document.body.appendChild(node)
  const root = createRoot(node)
  act(() => { root.render(component) })
  node.__root = root
  return node
}
const unmount = (node) => {
  if (node && node.__root) act(() => { node.__root.unmount() })
  if (node && node.parentNode) node.parentNode.removeChild(node)
}

describe('XrGutter', () => {
  let node
  afterEach(() => { unmount(node) })

  it('renders the XR badge absolutely (out of flow) to the left of the content when merged', () => {
    node = mountIn(
      <XrGutter merged>
        <span className="content">Felis catus</span>
      </XrGutter>
    )
    // Content is rendered.
    expect(node.textContent).toContain('Felis catus')
    // The XR badge is present and absolutely positioned so it never widens the
    // row / pushes the content (the property Option 1 guarantees).
    const tag = node.querySelector('.ant-tag')
    expect(tag).toBeTruthy()
    expect(tag.textContent).toBe('XR')
    expect(tag.style.position).toBe('absolute')
    expect(tag.style.right).toBe('100%')
  })

  it('renders only the content (no badge) when not merged', () => {
    node = mountIn(
      <XrGutter merged={false}>
        <span className="content">Felis catus</span>
      </XrGutter>
    )
    expect(node.textContent).toContain('Felis catus')
    expect(node.querySelector('.ant-tag')).toBeNull()
  })
})
