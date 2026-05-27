// React 18+ checks this flag to decide whether the testing environment supports
// concurrent act(). Setting it silences the "current testing environment is not
// configured to support act(...)" warning we get from createRoot.render under
// vitest+jsdom.
globalThis.IS_REACT_ACT_ENVIRONMENT = true

// jsdom has no ResizeObserver — stub it so antd components don't throw
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// maplibre-gl calls window.URL.createObjectURL at import time to set up its
// web worker. jsdom doesn't implement it — stub minimal blob/Worker plumbing
// so the module loads. No tests actually mount the map, so the worker URL is
// never used.
if (typeof window !== 'undefined') {
  if (!window.URL.createObjectURL) {
    window.URL.createObjectURL = () => 'blob://stub'
  }
  if (!window.URL.revokeObjectURL) {
    window.URL.revokeObjectURL = () => {}
  }
}

// jsdom has no matchMedia — stub it for antd's responsive observer
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
})


// Suppress unhandled rejections from async API calls that resolve after
// components unmount (e.g. 404 from /vocab/country). These are benign
// side effects of testing real API components in jsdom.
process.on('unhandledRejection', (err) => {
  if (err && err.isAxiosError) return
  throw err
})
