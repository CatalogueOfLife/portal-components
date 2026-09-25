import { LinkOutlined } from "@ant-design/icons";

// DOIs arrive in several spellings: bare, "doi:"-prefixed or as a resolver URL.
const DOI_PREFIX_RE = /^(doi:|https?:\/\/(dx\.)?doi\.org\/)/i;

/**
 * The link of a reference: its csl.URL (e.g. a BHL page), else a doi.org link
 * for its csl.DOI. Both usually live only in the CSL data, not in the
 * citation string.
 */
export const referenceHref = (reference) => {
  const csl = reference?.csl;
  if (csl?.URL) return csl.URL;
  if (csl?.DOI) return `https://doi.org/${csl.DOI.trim().replace(DOI_PREFIX_RE, "")}`;
  return undefined;
};

/**
 * A link icon pointing at the reference's URL or DOI. Renders nothing when
 * there is none, or when the citation already contains that exact link (it is
 * linkified there).
 */
const ReferenceLink = ({ reference }) => {
  const href = referenceHref(reference);
  if (!href || reference.citation?.includes(href)) return null;
  return (
    <>
      {" "}
      <a href={href} target="_blank" rel="noopener noreferrer">
        <LinkOutlined />
      </a>
    </>
  );
};

export default ReferenceLink;
