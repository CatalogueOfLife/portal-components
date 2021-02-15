import React from "react";
import svg404 from './404.svg';
export default () => (
  <React.Fragment>
    <div
      style={{
        minHeight: 'calc(100vh - 100px)',
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }}
      className="catalogue-of-life"
    >
        <div style={{
                    backgroundImage: `url(${svg404})`,
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: 'cover',
                    padding: "200px 176px 200px 224px"
        }}>
      <div style={{ textAlign: "center", fontWeight: 800 }}>
        <h1>404</h1>
      </div>
      <div style={{ textAlign: "center", fontWeight: 800 }}>
        <p>Sorry, this page does not exist.</p>
      </div>
      

      </div>
    </div>
  </React.Fragment>
);
