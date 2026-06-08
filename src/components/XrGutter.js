import React from "react";
import MergedDataBadge from "./MergedDataBadge";

// Renders the XR (merged-data) badge in the left gutter of a line or table
// cell. The badge is absolutely positioned just left of the content, so it
// takes no flow width — the content stays at the same position whether or not
// the badge is shown. This keeps list/table rows aligned (mirroring how the
// taxon title places its XR badge) instead of appending the badge after the
// name or wedging it mid-line.
//
// When `merged` is falsy the children render unchanged (no wrapper). Any extra
// props are forwarded to MergedDataBadge (datasetKey, verbatimSourceKey,
// sourceDatasetKey, sourceId, createdBy, …).
const XrGutter = ({ merged, style, children, ...badgeProps }) =>
  merged ? (
    <span style={{ position: "relative", display: "inline-block", ...style }}>
      <MergedDataBadge
        {...badgeProps}
        style={{
          position: "absolute",
          right: "100%",
          top: "50%",
          transform: "translateY(-50%)",
          marginRight: "4px",
        }}
      />
      {children}
    </span>
  ) : (
    <>{children}</>
  );

export default XrGutter;
