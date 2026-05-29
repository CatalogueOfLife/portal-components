import axios from "axios";

// A dedicated axios instance for all col-browser API calls. Auth credentials
// live on THIS instance rather than on axios.defaults, so setting them never
// mutates the host application's global axios. Public endpoints that must NOT
// send credentials (e.g. the feedback POST in Taxon/Feedback.js) use the bare
// `axios` import to opt out.
const client = axios.create();

// Set (or clear) HTTP Basic auth for all col-browser requests.
// `auth` is a "user:password" string; pass a falsy value to clear it.
export function setAuth(auth) {
  if (auth) {
    client.defaults.headers.common["Authorization"] = `Basic ${btoa(auth)}`;
  } else {
    delete client.defaults.headers.common["Authorization"];
  }
}

export default client;
