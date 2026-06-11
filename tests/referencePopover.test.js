import React from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import ReferencePopover from 'src/Taxon/ReferencePopover'

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

describe('ReferencePopover inline marker cap', () => {
  let node
  afterEach(() => { unmount(node) })

  // Regression guard for #57: a name linked to many references must not render
  // an unreadable trail of [n] markers. Markers are capped and the rest
  // collapse into a "+N" indicator.
  it('caps inline [n] markers and shows a +N overflow indicator', () => {
    const ids = Array.from({ length: 63 }, (_, i) => `r${i + 1}`)
    const referenceIndexMap = ids.reduce((acc, id, i) => {
      acc[id] = (i + 1).toString()
      return acc
    }, {})

    node = mountIn(
      <ReferencePopover
        datasetKey="315192"
        references={{}}
        referenceIndexMap={referenceIndexMap}
        referenceId={ids}
        maxInline={4}
      />
    )

    const links = node.querySelectorAll('a.col-reference-link')
    expect(links.length).toBe(4)
    // The remaining 59 collapse into a single overflow indicator.
    expect(node.innerHTML).toContain('+59')
  })

  it('shows every marker and no overflow when within the cap', () => {
    const ids = ['r1', 'r2', 'r3']
    const referenceIndexMap = { r1: '1', r2: '2', r3: '3' }

    node = mountIn(
      <ReferencePopover
        datasetKey="315192"
        references={{}}
        referenceIndexMap={referenceIndexMap}
        referenceId={ids}
        maxInline={4}
      />
    )

    const links = node.querySelectorAll('a.col-reference-link')
    expect(links.length).toBe(3)
    expect(node.innerHTML).not.toContain('+')
  })
})
