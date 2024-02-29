var $ = Object.defineProperty;
var b = (o, t, e) => t in o ? $(o, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : o[t] = e;
var f = (o, t, e) => (b(o, typeof t != "symbol" ? t + "" : t, e), e);
import c from "k6/http";
import { check as l } from "k6";
import { FormData as _ } from "https://jslib.k6.io/formdata/0.0.2/index.js";
const m = {
  COOKIE: 0,
  OAUTH2: 1
};
class S {
  constructor(t, e, r, s) {
    f(this, "expiresAt");
    f(this, "token");
    f(this, "mode");
    f(this, "cookies");
    this.token = t, this.mode = e, this.cookies = s, this.expiresAt = Date.now() + r * 1e3 - 3e3;
  }
  isExpired() {
    return this.expiresAt <= Date.now();
  }
  getCookie(t) {
    return this.cookies ? this.cookies.filter((e) => e.name === t).map((e) => e.value)[0] : null;
  }
}
const v = __ENV.BASE_URL, I = 30 * 60, g = __ENV.ROOT_URL, u = function(o) {
  let t;
  return o ? o.mode === m.COOKIE ? t = { "x-xsrf-token": o.getCookie("XSRF-TOKEN") || "" } : o.mode === m.OAUTH2 ? t = { Authorization: `Bearer ${o.token}` } : t = {} : t = {}, t;
}, E = function(o, t) {
  const e = c.get(`${g}/conversation/visible?search=${o}`, {
    headers: u(t)
  });
  return l(e, {
    "should get an OK response": (s) => s.status == 200
  }), e.json("users")[0].id;
}, N = function(o) {
  const t = c.get(`${g}/auth/oauth2/userinfo`, {
    headers: u(o)
  });
  return l(t, {
    "should get an OK response": (e) => e.status == 200,
    "should get a valid userId": (e) => !!e.json("userId")
  }), t.json("userId");
}, j = function(o, t) {
  let e = {
    email: o,
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
    m.COOKIE,
    I,
    n
  );
}, x = function(o, t, e, r) {
  let s = {
    grant_type: "password",
    username: o,
    password: t,
    client_id: e,
    client_secret: r,
    scope: "timeline userbook blog lvs actualites pronote schoolbook support viescolaire zimbra conversation directory homeworks userinfo workspace portal cas sso presences incidents competences diary edt infra auth"
  }, n = c.post(`${g}/auth/oauth2/token`, s, {
    redirects: 0
  });
  l(n, {
    "should get an OK response for authentication": (i) => i.status == 200,
    "should have set an access token": (i) => !!i.json("access_token")
  });
  const a = n.json("access_token");
  return new S(
    a,
    m.OAUTH2,
    n.json("expires_in")
  );
}, C = function(o, t) {
  const e = c.get(`${v}/metrics`, {
    headers: u(t)
  });
  l(e, {
    "should get an OK response": (s) => s.status == 200
  });
  const r = e.body.split(`
`);
  for (let s of r)
    if (s.indexOf(`${o} `) === 0)
      return parseFloat(s.substring(o.length + 1).trim());
  return console.error("Metric", o, "not found"), null;
}, p = __ENV.ROOT_URL;
function O(o, t) {
  let e = c.get(`${p}/directory/api/ecole`, {
    headers: u(t)
  });
  const r = JSON.parse(e.body).result;
  return Object.keys(r || {}).map((n) => r[n]).filter((n) => n.name === o)[0];
}
function J(o, t) {
  let e = c.get(`${p}/directory/structure/${o.id}/users`, {
    headers: u(t)
  });
  if (e.status !== 200)
    throw `Impossible to get users of ${o.id}`;
  return JSON.parse(e.body);
}
function K(o, t) {
  let e = c.get(`${p}/directory/structure/${o.id}/users`, {
    headers: u(t)
  });
  l(e, {
    "fetch structure users": (s) => s.status == 200
  });
  const r = JSON.parse(e.body);
  for (let s = 0; s < r.length; s++) {
    const n = r[s];
    if (n.code) {
      const a = {};
      a.login = n.login, a.activationCode = n.code, a.password = "password", a.confirmPassword = "password", a.acceptCGU = "true", e = c.post(`${p}/auth/activation`, a, {
        redirects: 0,
        headers: { Host: "localhost" }
      }), l(e, {
        "activate user": (i) => i.status === 302
      });
    }
  }
}
function B(o, t, e) {
  const s = w(o.id, e).filter(
    (n) => n.name === `Teachers from group ${o.name}.` || n.name === `Enseignants du groupe ${o.name}.`
  )[0];
  if (s.roles.indexOf(t.name) >= 0)
    console.log("Role already attributed to teachers");
  else {
    const n = u(e);
    n["content-type"] = "application/json";
    const a = { headers: n }, i = JSON.stringify({
      groupId: s.id,
      roleIds: (s.roles || []).concat([t.id])
    }), h = c.post(
      `${p}/appregistry/authorize/group?schoolId=${o.id}`,
      i,
      a
    );
    l(h, {
      "link role to structure": (d) => d.status == 200
    });
  }
}
function H(o, t, e) {
  let r = O(o, e);
  if (r)
    console.log("School already exists");
  else {
    const s = new _();
    s.append("type", "CSV"), s.append("structureName", o), s.append("Teacher", c.file(t, "enseignants.csv"));
    const n = u(e);
    n["Content-Type"] = "multipart/form-data; boundary=" + s.boundary;
    const a = { headers: n }, i = c.post(
      `${p}/directory/wizard/import`,
      s.body(),
      a
    );
    l(i, {
      "import structure is ok": (h) => h.status == 200
    }), r = O(o, e);
  }
  return r;
}
const y = __ENV.ROOT_URL;
function k(o, t) {
  let e = c.get(`${y}/appregistry/roles`, {
    headers: u(t)
  });
  return JSON.parse(e.body).filter((s) => s.name === o)[0];
}
function L(o, t) {
  const e = `${o} - All - Stress Test`;
  let r = k(e, t);
  if (r)
    console.log(`Role ${e} already existed`);
  else {
    let s = c.get(
      `${y}/appregistry/applications/actions?actionType=WORKFLOW`,
      { headers: u(t) }
    );
    l(s, { "get workflow actions": (d) => d.status == 200 });
    const a = JSON.parse(s.body).filter(
      (d) => d.name === o
    )[0].actions.map((d) => d[0]), i = u(t);
    i["content-type"] = "application/json";
    const h = {
      role: e,
      actions: a
    };
    s = c.post(`${y}/appregistry/role`, JSON.stringify(h), {
      headers: i
    }), console.log(s), l(s, { "save role ok": (d) => d.status == 201 }), r = k(e, t);
  }
  return r;
}
function w(o, t) {
  let e = c.get(
    `${y}/appregistry/groups/roles?structureId=${o}`,
    { headers: u(t) }
  );
  return l(e, {
    "get structure roles should be ok": (r) => r.status == 200
  }), JSON.parse(e.body);
}
export {
  v as BASE_URL,
  S as Session,
  m as SessionMode,
  K as activateUsers,
  x as authenticateOAuth2,
  j as authenticateWeb,
  L as createAndSetRole,
  H as createStructure,
  N as getConnectedUserId,
  u as getHeaders,
  C as getMetricValue,
  k as getRoleByName,
  w as getRolesOfStructure,
  O as getSchoolByName,
  J as getUsersOfSchool,
  B as linkRoleToUsers,
  E as searchUser
};
