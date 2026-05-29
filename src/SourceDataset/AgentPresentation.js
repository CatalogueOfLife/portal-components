import React from "react";
import { get } from "lodash-es";

const AgentPresentation = ({ agent, countryAlpha2, style, noLinks }) => {
  const country = get(agent, "country")
    ? get(
        countryAlpha2,
        `[${get(agent, "country")}].title`,
        get(agent, "country")
      )
    : null;
  return agent ? (
    <span style={style}>
      {(agent.given || agent.family) && (
        <span style={{ display: "block" }}>
          {[agent.family, agent.given].filter((a) => !!a).join(", ")}
        </span>
      )}
      {agent.orcid &&
        (noLinks ? (
          <div>
            <img
              src="https://www.checklistbank.org/images/orcid_16x16.png"
              style={{ flex: "0 0 auto" }}
              alt=""
            ></img>{" "}
            {agent.orcid}
          </div>
        ) : (
          <a
            style={{ display: "block" }}
            href={`https://orcid.org/${agent.orcid}`}
          >
            <img
              src="https://www.checklistbank.org/images/orcid_16x16.png"
              style={{ flex: "0 0 auto" }}
              alt=""
            ></img>{" "}
            {agent.orcid}
          </a>
        ))}
      {agent.organisation && (
        <span style={{ display: "block" }}>{agent.organisation}</span>
      )}
           {agent.rorid &&
        (noLinks ? (
          <div>
            <img
              src="https://www.checklistbank.org/images/ror-logo-small.png"
              style={{ flex: "0 0 auto", height: "20px" }}
              alt=""
            ></img>{" "}
            {agent.rorid}
          </div>
        ) : (
          <a
            style={{ display: "block" }}
            href={`https://ror.org/${agent.rorid}`}
          >
            <img
              src="https://www.checklistbank.org/images/ror-logo-small.png"
              style={{ flex: "0 0 auto", height: "20px" }}
              alt=""
            ></img>{" "}
            {agent.rorid}
          </a>
        ))}

      {agent.department && (
        <span style={{ display: "block" }}>{agent.department}</span>
      )}
      {(agent.city || agent.state || country) && (
        <span style={{ display: "block" }}>
          {[agent.city, agent.state, country].filter((a) => !!a).join(", ")}
        </span>
      )}
      
    </span>
  ) : null;
};



export default AgentPresentation;
