import React from "react";
import { ConfigProvider, theme as antdTheme } from "antd";

// Optional antd theming. Embedders can pass:
//   - `theme`: a full antd ThemeConfig (token / algorithm / components),
//     forwarded straight to ConfigProvider.
//   - `darkMode`: convenience boolean. When true and theme.algorithm is not
//     set, antd's darkAlgorithm is applied.
// When neither prop is provided we render the wrapped component directly,
// without a ConfigProvider, so the library's defaults are untouched.
export function withTheme(Component) {
  const Wrapped = (props) => {
    const { theme, darkMode, ...rest } = props;

    if (!theme && !darkMode) {
      return <Component {...rest} />;
    }

    const merged = { ...(theme || {}) };
    if (darkMode && !merged.algorithm) {
      merged.algorithm = antdTheme.darkAlgorithm;
    }

    return (
      <ConfigProvider theme={merged}>
        <Component darkMode={darkMode} {...rest} />
      </ConfigProvider>
    );
  };
  Wrapped.displayName = `withTheme(${
    Component.displayName || Component.name || "Component"
  })`;
  return Wrapped;
}

export default withTheme;
