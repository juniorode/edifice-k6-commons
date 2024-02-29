var O = Object.defineProperty;
var g = (o, e, s) => e in o ? O(o, e, { enumerable: !0, configurable: !0, writable: !0, value: s }) : o[e] = s;
var a = (o, e, s) => (g(o, typeof e != "symbol" ? e + "" : e, s), s);
import c from "k6/http";
import { check as l } from "k6";
const h = {
  COOKIE: 0,
  OAUTH2: 1
};
class k {
  constructor(e, s, t, n) {
    a(this, "expiresAt");
    a(this, "token");
    a(this, "mode");
    a(this, "cookies");
    this.token = e, this.mode = s, this.cookies = n, this.expiresAt = Date.now() + t * 1e3 - 3e3;
  }
  isExpired() {
    return this.expiresAt <= Date.now();
  }
  getCookie(e) {
    return this.cookies ? this.cookies.filter((s) => s.name === e).map((s) => s.value)[0] : null;
  }
}
const m = __ENV.BASE_URL, _ = 30 * 60, u = __ENV.ROOT_URL, d = function(o) {
  let e;
  return o ? o.mode === h.COOKIE ? e = { "x-xsrf-token": o.getCookie("XSRF-TOKEN") || "" } : o.mode === h.OAUTH2 ? e = { Authorization: `Bearer ${o.token}` } : e = {} : e = {}, e;
}, b = function(o, e) {
  const s = c.get(`${u}/conversation/visible?search=${o}`, {
    headers: d(e)
  });
  return l(s, {
    "should get an OK response": (n) => n.status == 200
  }), s.json("users")[0].id;
}, U = function(o) {
  const e = c.get(`${u}/auth/oauth2/userinfo`, {
    headers: d(o)
  });
  return l(e, {
    "should get an OK response": (s) => s.status == 200,
    "should get a valid userId": (s) => !!s.json("userId")
  }), e.json("userId");
}, $ = function(o, e) {
  let s = {
    email: o,
    password: e,
    callBack: "",
    detail: ""
  };
  const t = c.post(`${u}/auth/login`, s, {
    redirects: 0
  });
  l(t, {
    "should redirect connected user to login page": (i) => i.status === 302,
    "should have set an auth cookie": (i) => i.cookies.oneSessionId !== null && i.cookies.oneSessionId !== void 0
  }), c.cookieJar().set(u, "oneSessionId", t.cookies.oneSessionId[0].value);
  const r = Object.keys(t.cookies).map((i) => ({ name: i, value: t.cookies[i][0].value }));
  return new k(
    t.cookies.oneSessionId[0].value,
    h.COOKIE,
    _,
    r
  );
}, A = function(o, e, s, t) {
  let n = {
    grant_type: "password",
    username: o,
    password: e,
    client_id: s,
    client_secret: t,
    scope: "timeline userbook blog lvs actualites pronote schoolbook support viescolaire zimbra conversation directory homeworks userinfo workspace portal cas sso presences incidents competences diary edt infra auth"
  }, r = c.post(`${u}/auth/oauth2/token`, n, {
    redirects: 0
  });
  l(r, {
    "should get an OK response for authentication": (p) => p.status == 200,
    "should have set an access token": (p) => !!p.json("access_token")
  });
  const i = r.json("access_token");
  return new k(
    i,
    h.OAUTH2,
    r.json("expires_in")
  );
}, E = function(o, e) {
  const s = c.get(`${m}/metrics`, {
    headers: d(e)
  });
  l(s, {
    "should get an OK response": (n) => n.status == 200
  });
  const t = s.body.split(`
`);
  for (let n of t)
    if (n.indexOf(`${o} `) === 0)
      return parseFloat(n.substring(o.length + 1).trim());
  return console.error("Metric", o, "not found"), null;
}, f = __ENV.ROOT_URL;
function y(o, e) {
  let s = c.get(`${f}/directory/api/ecole`, {
    headers: d(e)
  });
  const t = JSON.parse(s.body).result;
  return Object.keys(t || {}).map((r) => t[r]).filter((r) => r.name === o)[0];
}
function j(o, e) {
  let s = c.get(`${f}/directory/structure/${o.id}/users`, {
    headers: d(e)
  });
  if (s.status !== 200)
    throw `Impossible to get users of ${o.id}`;
  return JSON.parse(s.body);
}
export {
  m as BASE_URL,
  k as Session,
  h as SessionMode,
  A as authenticateOAuth2,
  $ as authenticateWeb,
  U as getConnectedUserId,
  d as getHeaders,
  E as getMetricValue,
  y as getSchoolByName,
  j as getUsersOfSchool,
  b as searchUser
};
