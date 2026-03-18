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

// Suppress React 16 "setState on unmounted component" warnings.
// These fire because async API calls resolve after tests unmount components.
// Not a real leak — React 18 removed this warning entirely.
const _consoleError = console.error
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('Can\'t perform a React state update on an unmounted component')) return
  _consoleError.apply(console, args)
}

// Suppress unhandled rejections from async API calls that resolve after
// components unmount (e.g. 404 from /vocab/country). These are benign
// side effects of testing real API components in jsdom.
process.on('unhandledRejection', (err) => {
  if (err && err.isAxiosError) return
  throw err
})
