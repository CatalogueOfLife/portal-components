import * as React from 'react'
import * as ReactDOMClient from 'react-dom/client'
import * as components from './'

// React 19 dropped UMD builds, so the col-browser UMD bundle bundles React
// and react-dom/client itself and re-exposes them on the ColBrowser global.
// Consumers use ColBrowser.React.createElement and ColBrowser.ReactDOM.createRoot
// to mount components — no separate react / react-dom <script> tags needed.
export default { ...components, React, ReactDOM: ReactDOMClient }