// A tiny fetch wrapper that mirrors the small slice of the axios API this
// library uses, so we can drop the axios dependency entirely (and, in the UMD
// build, the Buffer polyfill that only existed for axios).
//
//   client(url, config?)            -> GET, with CoL Basic-Auth when set
//   client.get/post/put/delete/...  -> same, per method
//   publicClient.*                  -> identical surface but never sends auth
//                                      (third-party GBIF + the public feedback POST)
//
// Responses resolve to { data, status } (data = parsed JSON). A non-2xx
// response rejects with an axios-shaped error: err.response = { status, data },
// plus err.message and err.config — so existing `err.response.status === 404`
// handling and ErrorMsg keep working unchanged. Network errors reject with
// err.response left undefined, matching axios.

let authHeader = null;

// Set (or clear) HTTP Basic auth for the authed client. `auth` is a
// "user:password" string; pass a falsy value to clear it.
export function setAuth(auth) {
  authHeader = auth ? `Basic ${btoa(auth)}` : null;
}

const buildUrl = (url, params) => {
  if (!params) return url;
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === null || v === undefined) return;
    if (Array.isArray(v)) v.forEach((item) => qs.append(k, item));
    else qs.append(k, v);
  });
  const q = qs.toString();
  if (!q) return url;
  return url + (url.includes("?") ? "&" : "?") + q;
};

const parseBody = async (res) => {
  if (res.status === 204) return null;
  const ct = res.headers && res.headers.get && res.headers.get("content-type");
  try {
    if (ct && ct.includes("application/json")) return await res.json();
    const text = await res.text();
    return text === "" ? null : text;
  } catch {
    return null;
  }
};

const request = async (
  url,
  { method = "GET", params, headers, data, withAuth } = {}
) => {
  const finalUrl = buildUrl(url, params);
  const finalHeaders = { ...(headers || {}) };
  if (withAuth && authHeader) finalHeaders.Authorization = authHeader;

  let body;
  if (data !== undefined) {
    body = JSON.stringify(data);
    const hasCt = Object.keys(finalHeaders).some(
      (h) => h.toLowerCase() === "content-type"
    );
    if (!hasCt) finalHeaders["Content-Type"] = "application/json";
  }

  let res;
  try {
    res = await fetch(finalUrl, { method, headers: finalHeaders, body });
  } catch (cause) {
    const err = new Error(cause?.message || "Network Error");
    err.request = cause;
    err.config = { method: method.toLowerCase(), url: finalUrl };
    throw err;
  }

  const payload = await parseBody(res);
  if (!res.ok) {
    const err = new Error(`Request failed with status code ${res.status}`);
    err.response = {
      status: res.status,
      data: payload,
      request: { responseURL: res.url },
    };
    err.config = { method: method.toLowerCase(), url: finalUrl, data: body };
    throw err;
  }
  return { data: payload, status: res.status };
};

const makeClient = (withAuth) => {
  const call = (url, config = {}) => request(url, { ...config, withAuth });
  call.get = (url, config = {}) => request(url, { ...config, method: "GET", withAuth });
  call.delete = (url, config = {}) =>
    request(url, { ...config, method: "DELETE", withAuth });
  call.post = (url, data, config = {}) =>
    request(url, { ...config, method: "POST", data, withAuth });
  call.put = (url, data, config = {}) =>
    request(url, { ...config, method: "PUT", data, withAuth });
  call.patch = (url, data, config = {}) =>
    request(url, { ...config, method: "PATCH", data, withAuth });
  return call;
};

const client = makeClient(true);
export const publicClient = makeClient(false);
export default client;
