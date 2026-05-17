import React from "react";

const warned = new Set();

function warnDeprecation(componentName, message) {
  const key = `${componentName}:${message}`;
  if (warned.has(key)) return;
  warned.add(key);
  if (typeof console !== "undefined" && console.warn) {
    console.warn(`[col-browser] <${componentName}> ${message}`);
  }
}

// Standard shim: `catalogueKey` was renamed to `datasetKey`.
// Accepts both, prefers `datasetKey`, warns once when only the
// deprecated name is supplied.
export default function withDatasetKey(WrappedComponent) {
  const name =
    WrappedComponent.displayName || WrappedComponent.name || "Component";

  const Wrapper = (props) => {
    const { catalogueKey, datasetKey, ...rest } = props;
    if (catalogueKey !== undefined && datasetKey === undefined) {
      warnDeprecation(
        name,
        "the `catalogueKey` prop is deprecated; rename it to `datasetKey`."
      );
    }
    const resolvedDatasetKey =
      datasetKey !== undefined ? datasetKey : catalogueKey;
    return <WrappedComponent {...rest} datasetKey={resolvedDatasetKey} />;
  };
  Wrapper.displayName = `withDatasetKey(${name})`;
  return Wrapper;
}

// BibTex-specific shim: the old prop pair
//   <BibTex datasetKey={source} catalogueKey={catalogue} />
// has been replaced by
//   <BibTex datasetKey={catalogue} sourceDatasetKey={source} />
// so when the legacy `catalogueKey` is present the two values must swap.
export function withBibTexLegacyShim(WrappedComponent) {
  const name =
    WrappedComponent.displayName || WrappedComponent.name || "BibTex";

  const Wrapper = (props) => {
    const { catalogueKey, datasetKey, sourceDatasetKey, ...rest } = props;
    if (catalogueKey !== undefined) {
      warnDeprecation(
        name,
        "the `catalogueKey` prop is deprecated; pass the catalogue as `datasetKey` and the source as `sourceDatasetKey`."
      );
      return (
        <WrappedComponent
          {...rest}
          datasetKey={catalogueKey}
          sourceDatasetKey={
            sourceDatasetKey !== undefined ? sourceDatasetKey : datasetKey
          }
        />
      );
    }
    return (
      <WrappedComponent
        {...rest}
        datasetKey={datasetKey}
        sourceDatasetKey={sourceDatasetKey}
      />
    );
  };
  Wrapper.displayName = `withBibTexLegacyShim(${name})`;
  return Wrapper;
}
