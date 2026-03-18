// jsdom has no ResizeObserver — stub it so antd components don't throw
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
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
