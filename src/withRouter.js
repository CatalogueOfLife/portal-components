import React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

// react-router-dom v6+ removed withRouter. Class components in this library
// still want `location` (and to a lesser extent `match`) injected as props;
// imperative navigation still goes through the shared `src/history` singleton
// via the HistoryRouter setup, so we do not need to forward `history` here.
export function withRouter(Component) {
  const Wrapped = (props) => {
    const location = useLocation();
    const navigate = useNavigate();
    const params = useParams();
    return (
      <Component
        {...props}
        location={location}
        navigate={navigate}
        match={{ params }}
      />
    );
  };
  Wrapped.displayName = `withRouter(${Component.displayName || Component.name || "Component"})`;
  return Wrapped;
}

export default withRouter;
