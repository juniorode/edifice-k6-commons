var $ = Object.defineProperty;
var b = (s, t, e) => t in s ? $(s, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : s[t] = e;
var f = (s, t, e) => (b(s, typeof t != "symbol" ? t + "" : t, e), e);
import c from "k6/http";
import { check as l } from "k6";
const y = {
  COOKIE: 0,
  OAUTH2: 1
};
class S {
  constructor(t, e, r, o) {
    f(this, "expiresAt");
    f(this, "token");
    f(this, "mode");
    f(this, "cookies");
    this.token = t, this.mode = e, this.cookies = o, this.expiresAt = Date.now() + r * 1e3 - 3e3;
  }
  isExpired() {
    return this.expiresAt <= Date.now();
  }
  getCookie(t) {
    return this.cookies ? this.cookies.filter((e) => e.name === t).map((e) => e.value)[0] : null;
  }
}
const _ = __ENV.BASE_URL, v = 30 * 60, g = __ENV.ROOT_URL, u = function(s) {
  let t;
  return s ? s.mode === y.COOKIE ? t = { "x-xsrf-token": s.getCookie("XSRF-TOKEN") || "" } : s.mode === y.OAUTH2 ? t = { Authorization: `Bearer ${s.token}` } : t = {} : t = {}, t;
}, T = function(s, t) {
  const e = c.get(`${g}/conversation/visible?search=${s}`, {
    headers: u(t)
  });
  return l(e, {
    "should get an OK response": (o) => o.status == 200
  }), e.json("users")[0].id;
}, A = function(s) {
  const t = c.get(`${g}/auth/oauth2/userinfo`, {
    headers: u(s)
  });
  return l(t, {
    "should get an OK response": (e) => e.status == 200,
    "should get a valid userId": (e) => !!e.json("userId")
  }), t.json("userId");
}, E = function(s, t) {
  let e = {
    email: s,
    password: t,
    callBack: "",
    detail: ""
  };
  const r = c.post(`${g}/auth/login`, e, {
    redirects: 0
  });
  l(r, {
    "should redirect connected user to login page": (a) => a.status === 302,
    "should have set an auth cookie": (a) => a.cookies.oneSessionId !== null && a.cookies.oneSessionId !== void 0
  }), c.cookieJar().set(g, "oneSessionId", r.cookies.oneSessionId[0].value);
  const n = Object.keys(r.cookies).map((a) => ({ name: a, value: r.cookies[a][0].value }));
  return new S(
    r.cookies.oneSessionId[0].value,
    y.COOKIE,
    v,
    n
  );
}, N = function(s, t, e, r) {
  let o = {
    grant_type: "password",
    username: s,
    password: t,
    client_id: e,
    client_secret: r,
    scope: "timeline userbook blog lvs actualites pronote schoolbook support viescolaire zimbra conversation directory homeworks userinfo workspace portal cas sso presences incidents competences diary edt infra auth"
  }, n = c.post(`${g}/auth/oauth2/token`, o, {
    redirects: 0
  });
  l(n, {
    "should get an OK response for authentication": (i) => i.status == 200,
    "should have set an access token": (i) => !!i.json("access_token")
  });
  const a = n.json("access_token");
  return new S(
    a,
    y.OAUTH2,
    n.json("expires_in")
  );
}, j = function(s, t) {
  const e = c.get(`${_}/metrics`, {
    headers: u(t)
  });
  l(e, {
    "should get an OK response": (o) => o.status == 200
  });
  const r = e.body.split(`
`);
  for (let o of r)
    if (o.indexOf(`${s} `) === 0)
      return parseFloat(o.substring(s.length + 1).trim());
  return console.error("Metric", s, "not found"), null;
}, p = __ENV.ROOT_URL;
function k(s, t) {
  let e = c.get(`${p}/directory/api/ecole`, {
    headers: u(t)
  });
  const r = JSON.parse(e.body).result;
  return Object.keys(r || {}).map((n) => r[n]).filter((n) => n.name === s)[0];
}
function x(s, t) {
  let e = c.get(`${p}/directory/structure/${s.id}/users`, {
    headers: u(t)
  });
  if (e.status !== 200)
    throw `Impossible to get users of ${s.id}`;
  return JSON.parse(e.body);
}
function C(s, t) {
  let e = c.get(`${p}/directory/structure/${s.id}/users`, { headers: u(t) });
  l(e, {
    "fetch structure users": (o) => o.status == 200
  });
  const r = JSON.parse(e.body);
  for (let o = 0; o < r.length; o++) {
    const n = r[o];
    if (n.code) {
      const a = {};
      a.login = n.login, a.activationCode = n.code, a.password = "password", a.confirmPassword = "password", a.acceptCGU = "true", e = c.post(`${p}/auth/activation`, a, { redirects: 0, headers: { Host: "localhost" } }), l(e, {
        "activate user": (i) => i.status === 302
      });
    }
  }
}
function J(s, t, e) {
  const o = I(s.id, e).filter((n) => n.name === `Teachers from group ${s.name}.` || n.name === `Enseignants du groupe ${s.name}.`)[0];
  if (o.roles.indexOf(t.name) >= 0)
    console.log("Role already attributed to teachers");
  else {
    const n = u(e);
    n["content-type"] = "application/json";
    const a = { headers: n }, i = JSON.stringify({
      groupId: o.id,
      roleIds: (o.roles || []).concat([t.id])
    }), h = c.post(`${p}/appregistry/authorize/group?schoolId=${s.id}`, i, a);
    l(h, {
      "link role to structure": (d) => d.status == 200
    });
  }
}
function K(s, t, e) {
  let r = k(s, e);
  if (r)
    console.log("School already exists");
  else {
    const o = new FormData();
    o.append("type", "CSV"), o.append("structureName", s), o.append("Teacher", c.file(t, "enseignants.csv"));
    const n = u(e);
    n["Content-Type"] = "multipart/form-data; boundary=" + o.boundary;
    const a = { headers: n }, i = c.post(`${p}/directory/wizard/import`, o.body(), a);
    l(i, {
      "import structure is ok": (h) => h.status == 200
    }), r = k(s, e);
  }
  return r;
}
const O = __ENV.ROOT_URL;
function m(s, t) {
  let e = c.get(`${O}/appregistry/roles`, { headers: u(t) });
  return JSON.parse(e.body).filter((o) => o.name === s)[0];
}
function B(s, t) {
  const e = `${s} - All - Stress Test`;
  let r = m(e, t);
  if (r)
    console.log(`Role ${e} already existed`);
  else {
    let o = c.get(`${O}/appregistry/applications/actions?actionType=WORKFLOW`, { headers: u(t) });
    l(o, { "get workflow actions": (d) => d.status == 200 });
    const a = JSON.parse(o.body).filter((d) => d.name === s)[0].actions.map((d) => d[0]), i = u(t);
    i["content-type"] = "application/json";
    const h = {
      role: e,
      actions: a
    };
    o = c.post(`${O}/appregistry/role`, JSON.stringify(h), { headers: i }), console.log(o), l(o, { "save role ok": (d) => d.status == 201 }), r = m(e, t);
  }
  return r;
}
function I(s, t) {
  let e = c.get(`${O}/appregistry/groups/roles?structureId=${s}`, { headers: u(t) });
  return l(e, {
    "get structure roles should be ok": (r) => r.status == 200
  }), JSON.parse(e.body);
}
export {
  _ as BASE_URL,
  S as Session,
  y as SessionMode,
  C as activateUsers,
  N as authenticateOAuth2,
  E as authenticateWeb,
  B as createAndSetRole,
  K as createStructure,
  A as getConnectedUserId,
  u as getHeaders,
  j as getMetricValue,
  m as getRoleByName,
  I as getRolesOfStructure,
  k as getSchoolByName,
  x as getUsersOfSchool,
  J as linkRoleToUsers,
  T as searchUser
};
