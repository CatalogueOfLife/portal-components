import { useEffect, useState } from "react";
import { getIdentifierScopeVocab } from "../api/enumeration";
import config from "../config";

// clb<datasetKey> scopes cross-reference a name usage in another
// ChecklistBank dataset.
const CLB_DATASET_RE = /^clb(\d+)$/;

/**
 * Split a CURIE-style identifier ("scope:id") into what a chip shows.
 *
 * @param {string} identifier  e.g. "wfo:wfo-0000123"
 * @param {object} vocab  the /vocab/identifier-scope map from `getIdentifierScopeVocab`
 * @returns {{scope?: string, value: string, title?: string, href?: string}}
 */
export const parseIdentifier = (identifier, vocab) => {
  const colonIdx = identifier.indexOf(":");
  if (colonIdx < 1) return { value: identifier };
  const scope = identifier.slice(0, colonIdx);
  const value = identifier.slice(colonIdx + 1);

  const clbMatch = scope.match(CLB_DATASET_RE);
  if (clbMatch) {
    return {
      scope: "clb",
      value,
      title: `ChecklistBank dataset ${clbMatch[1]}`,
      href: `${config.clbPortal}/dataset/${clbMatch[1]}/nameusage/${encodeURIComponent(value)}`,
    };
  }

  const entry = vocab?.[scope];
  return {
    scope,
    value,
    title: entry?.title || scope,
    href: entry?.resolver
      ? entry.resolver.replace("{id}", encodeURIComponent(value))
      : undefined,
  };
};

/**
 * Compact two-part chip: a muted scope segment and the identifier value. The
 * whole chip links out when the scope has a resolver.
 */
const IdentifierChip = ({ scope, value, title, href }) => {
  const inner = (
    <>
      {scope && <span className="col-identifier-scope">{scope}</span>}
      <span className="col-identifier-value">{value}</span>
    </>
  );
  return href ? (
    <a
      className="col-identifier"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={title}
    >
      {inner}
    </a>
  ) : (
    <span className="col-identifier" title={title}>
      {inner}
    </span>
  );
};

/**
 * Renders identifiers as compact chips in a wrapping row, the way
 * ChecklistBank does. Loads (and shares) the identifier scope vocabulary
 * itself; until it arrives the chips render unlinked.
 *
 *   <IdentifierList identifiers={taxon.identifier} />
 */
const IdentifierList = ({ identifiers }) => {
  const [vocab, setVocab] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getIdentifierScopeVocab()
      .then((v) => {
        if (!cancelled) setVocab(v);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="col-identifier-list">
      {identifiers.map((id) => (
        <IdentifierChip key={id} {...parseIdentifier(String(id), vocab)} />
      ))}
    </div>
  );
};

export default IdentifierList;
