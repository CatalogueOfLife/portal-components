import React, { createContext, useContext } from "react";

// One context provides the four navigation primitives every component
// might want. Each top-level component (Taxon, Tree, Search,
// SourceDataset, ...) builds this from its `onNavigateToX` / `hrefForX`
// props and wraps its subtree in a Provider. Sub-components don't get
// pathToX props anymore — they consume the context directly via <LinkTo>.

const noop = () => undefined;

const defaultRouter = {
  taxon:  { onNavigate: null, hrefFor: null },
  tree:   { onNavigate: null, hrefFor: null },
  search: { onNavigate: null, hrefFor: null },
  source: { onNavigate: null, hrefFor: null },
};

export const RouterContext = createContext(defaultRouter);

export const useRouter = () => useContext(RouterContext);

// Builds a context value from the top-level component's props.
// Pass through whichever of the four navigation pairs are wired up.
export const buildRouter = (props) => ({
  taxon: {
    onNavigate: props.onNavigateToTaxon || null,
    hrefFor:    props.hrefForTaxon      || null,
  },
  tree: {
    onNavigate: props.onNavigateToTree  || null,
    hrefFor:    props.hrefForTree       || null,
  },
  search: {
    onNavigate: props.onNavigateToSearch || null,
    hrefFor:    props.hrefForSearch      || null,
  },
  source: {
    onNavigate: props.onNavigateToSource || null,
    hrefFor:    props.hrefForSource      || null,
  },
});

// <LinkTo to="taxon" args={id}>{children}</LinkTo>
//
//   - Renders <a href={hrefFor(args)} onClick={...}> when both are wired.
//   - Renders <a href="#" onClick={...}> when only onNavigate is wired.
//   - Renders <a href={hrefFor(args)}> when only hrefFor is wired.
//   - Renders plain <span> when neither is wired.
//
// `args` is whatever the host's onNavigate/hrefFor expects (usually an
// id string, but tree+search may pass an object).
export const LinkTo = ({ to, args, children, className, style, title }) => {
  const router = useRouter();
  const slot = router[to];
  if (!slot) return <span style={style} className={className} title={title}>{children}</span>;
  const { onNavigate, hrefFor } = slot;
  const href = hrefFor ? hrefFor(args) : (onNavigate ? "#" : null);

  if (!onNavigate && !href) {
    return <span style={style} className={className} title={title}>{children}</span>;
  }
  const handleClick = onNavigate
    ? (e) => {
        // Let middle-click / cmd-click open in a new tab when an href is set.
        if (e.defaultPrevented) return;
        if (e.button !== 0) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        onNavigate(args);
      }
    : undefined;
  return (
    <a
      href={href || undefined}
      onClick={handleClick}
      className={className}
      style={style}
      title={title}
    >
      {children}
    </a>
  );
};

// Imperative variant for code paths that don't render a link but want
// to trigger navigation (e.g. tree-node click handlers that already
// have their own onClick wiring).
export const useNavigateTo = (to) => {
  const router = useRouter();
  const slot = router[to];
  if (!slot || !slot.onNavigate) return noop;
  return slot.onNavigate;
};
