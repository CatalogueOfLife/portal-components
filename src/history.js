// history.js
import { createBrowserHistory } from 'history'

// Wrap push/replace so a partial-path target without an explicit `hash` field
// preserves the current location.hash. history@5 otherwise treats the
// missing field as `""` and erases any in-page anchor / hash route the host
// might be using (the GitHub Pages demo relies on this for hash-based
// routing; ordinary embedders get the friendlier "don't blow away my #anchor"
// default for free).
const real = createBrowserHistory()
const keepHash = (to) =>
  to && typeof to === 'object' && to.hash === undefined
    ? { ...to, hash: real.location.hash }
    : to

export default {
  get location() { return real.location },
  get action() { return real.action },
  createHref: (...args) => real.createHref(...args),
  push: (to, state) => real.push(keepHash(to), state),
  replace: (to, state) => real.replace(keepHash(to), state),
  go: (delta) => real.go(delta),
  back: () => real.back(),
  forward: () => real.forward(),
  block: (blocker) => real.block(blocker),
  listen: (listener) => real.listen(listener),
}