import { useEffect, useState } from "react";
import { getNomStatusVocab } from "../api/enumeration";

// Nomenclatural status terms differ between the codes: the status "acceptable"
// is "nomen legitimum" to a botanist and "potentially valid" to a zoologist.
// The vocabulary carries one label per code family, currently only `botanical`
// and `zoological`. Names governed by another code (bacterial, virus,
// cultivars, …) or by no code at all fall back to the zoological wording, which
// is what ChecklistBank shows for them too.
const NOM_CODES = new Set([
  "bacterial",
  "botanical",
  "cultivars",
  "phyto",
  "phylo",
  "virus",
  "zoological",
]);

/**
 * Resolve the label for a nomenclatural status under a given nomenclatural code.
 *
 * @param {object} vocab  the /vocab/nomstatus map from `getNomStatusVocab`
 * @param {string} nomStatus  a name's `nomStatus`, e.g. "acceptable"
 * @param {string} code  the name's `code`, e.g. "botanical"
 * @returns {string} the code-specific label, or the bare status if unresolvable
 */
export const nomStatusLabel = (vocab, nomStatus, code) => {
  if (!nomStatus) return "";
  const term = vocab?.[nomStatus];
  // No vocabulary (still loading, or the request failed): show the raw term
  // rather than nothing.
  if (!term) return nomStatus;
  const key =
    NOM_CODES.has(code) && typeof term[code] === "string" ? code : "zoological";
  return term[key] || term.name || nomStatus;
};

/**
 * Renders a name's nomenclatural status using the wording of its own code.
 * Loads (and shares) the vocabulary itself, so callers only pass the two
 * values they already have on the name:
 *
 *   <NomStatus nomStatus={name.nomStatus} code={name.code} />
 */
const NomStatus = ({ nomStatus, code, brackets }) => {
  const [vocab, setVocab] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getNomStatusVocab()
      .then((v) => {
        if (!cancelled) setVocab(v);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!nomStatus) return null;
  const label = nomStatusLabel(vocab, nomStatus, code);
  return <>{brackets ? `(${label})` : label}</>;
};

export default NomStatus;
