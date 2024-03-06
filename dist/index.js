var v = Object.defineProperty;
var _ = (s, e, t) => e in s ? v(s, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : s[e] = t;
var f = (s, e, t) => (_(s, typeof e != "symbol" ? e + "" : e, t), t);
import c from "k6/http";
import { check as l } from "k6";
import { FormData as I } from "https://jslib.k6.io/formdata/0.0.2/index.js";
const m = {
  COOKIE: 0,
  OAUTH2: 1
};
class S {
  constructor(e, t, r, o) {
    f(this, "expiresAt");
    f(this, "token");
    f(this, "mode");
    f(this, "cookies");
    this.token = e, this.mode = t, this.cookies = o, this.expiresAt = Date.now() + r * 1e3 - 3e3;
  }
  isExpired() {
    return this.expiresAt <= Date.now();
  }
  getCookie(e) {
    return this.cookies ? this.cookies.filter((t) => t.name === e).map((t) => t.value)[0] : null;
  }
}
const R = __ENV.BASE_URL, w = 30 * 60, g = __ENV.ROOT_URL, u = function(s) {
  let e;
  return s ? s.mode === m.COOKIE ? e = { "x-xsrf-token": s.getCookie("XSRF-TOKEN") || "" } : s.mode === m.OAUTH2 ? e = { Authorization: `Bearer ${s.token}` } : e = {} : e = {}, e;
}, j = function(s, e) {
  const t = c.get(`${g}/conversation/visible?search=${s}`, {
    headers: u(e)
  });
  return l(t, {
    "should get an OK response": (o) => o.status == 200
  }), t.json("users")[0].id;
}, x = function(s) {
  const e = c.get(`${g}/auth/oauth2/userinfo`, {
    headers: u(s)
  });
  return l(e, {
    "should get an OK response": (t) => t.status == 200,
    "should get a valid userId": (t) => !!t.json("userId")
  }), e.json("userId");
}, C = function(s, e) {
  let t = {
    email: s,
    password: e,
    callBack: "",
    detail: ""
  };
  const r = c.post(`${g}/auth/login`, t, {
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
    w,
    n
  );
}, J = function(s, e, t, r) {
  let o = {
    grant_type: "password",
    username: s,
    password: e,
    client_id: t,
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
    m.OAUTH2,
    n.json("expires_in")
  );
}, K = function(s, e) {
  const t = c.get(`${R}/metrics`, {
    headers: u(e)
  });
  l(t, {
    "should get an OK response": (o) => o.status == 200
  });
  const r = t.body.split(`
`);
  for (let o of r)
    if (o.indexOf(`${s} `) === 0)
      return parseFloat(o.substring(s.length + 1).trim());
  return console.error("Metric", s, "not found"), null;
}, h = __ENV.ROOT_URL;
function O(s, e) {
  let t = c.get(`${h}/directory/api/ecole`, {
    headers: u(e)
  });
  const r = JSON.parse(t.body).result;
  return Object.keys(r || {}).map((n) => r[n]).filter((n) => n.name === s)[0];
}
function B(s, e) {
  let t = c.get(`${h}/directory/structure/${s.id}/users`, {
    headers: u(e)
  });
  if (t.status !== 200)
    throw `Impossible to get users of ${s.id}`;
  return JSON.parse(t.body);
}
function H(s, e) {
  let t = c.get(`${h}/directory/structure/${s.id}/users`, {
    headers: u(e)
  });
  l(t, {
    "fetch structure users": (o) => o.status == 200
  });
  const r = JSON.parse(t.body);
  for (let o = 0; o < r.length; o++) {
    const n = r[o];
    if (n.code) {
      const a = {};
      a.login = n.login, a.activationCode = n.code, a.password = "password", a.confirmPassword = "password", a.acceptCGU = "true", t = c.post(`${h}/auth/activation`, a, {
        redirects: 0,
        headers: { Host: "localhost" }
      }), l(t, {
        "activate user": (i) => i.status === 302
      });
    }
  }
}
function L(s, e, t) {
  const o = U(s.id, t).filter(
    (n) => n.name === `Teachers from group ${s.name}.` || n.name === `Enseignants du groupe ${s.name}.`
  )[0];
  if (o.roles.indexOf(e.name) >= 0)
    console.log("Role already attributed to teachers");
  else {
    const n = u(t);
    n["content-type"] = "application/json";
    const a = { headers: n }, i = JSON.stringify({
      groupId: o.id,
      roleIds: (o.roles || []).concat([e.id])
    }), p = c.post(
      `${h}/appregistry/authorize/group?schoolId=${s.id}`,
      i,
      a
    );
    l(p, {
      "link role to structure": (d) => d.status == 200
    });
  }
}
function V(s, e, t) {
  let r = O(s, t);
  if (r)
    console.log("School already exists");
  else {
    const o = new I();
    o.append("type", "CSV"), o.append("structureName", s);
    let n, a, i;
    "teachers" in e ? (n = e.teachers, a = e.students, i = e.responsables) : n = e, o.append("Teacher", c.file(n, "enseignants.csv")), a && o.append("Student", c.file(a, "eleves.csv")), i && o.append("Relative", c.file(i, "responsables.csv"));
    const p = u(t);
    p["Content-Type"] = "multipart/form-data; boundary=" + o.boundary;
    const d = { headers: p }, $ = c.post(
      `${h}/directory/wizard/import`,
      o.body(),
      d
    );
    l($, {
      "import structure is ok": (b) => b.status == 200
    }), r = O(s, t);
  }
  return r;
}
const y = __ENV.ROOT_URL;
function k(s, e) {
  let t = c.get(`${y}/appregistry/roles`, {
    headers: u(e)
  });
  return JSON.parse(t.body).filter((o) => o.name === s)[0];
}
function z(s, e) {
  const t = `${s} - All - Stress Test`;
  let r = k(t, e);
  if (r)
    console.log(`Role ${t} already existed`);
  else {
    let o = c.get(
      `${y}/appregistry/applications/actions?actionType=WORKFLOW`,
      { headers: u(e) }
    );
    l(o, { "get workflow actions": (d) => d.status == 200 });
    const a = JSON.parse(o.body).filter(
      (d) => d.name === s
    )[0].actions.map((d) => d[0]), i = u(e);
    i["content-type"] = "application/json";
    const p = {
      role: t,
      actions: a
    };
    o = c.post(`${y}/appregistry/role`, JSON.stringify(p), {
      headers: i
    }), console.log(o), l(o, { "save role ok": (d) => d.status == 201 }), r = k(t, e);
  }
  return r;
}
function U(s, e) {
  let t = c.get(
    `${y}/appregistry/groups/roles?structureId=${s}`,
    { headers: u(e) }
  );
  return l(t, {
    "get structure roles should be ok": (r) => r.status == 200
  }), JSON.parse(t.body);
}
export {
  R as BASE_URL,
  S as Session,
  m as SessionMode,
  H as activateUsers,
  J as authenticateOAuth2,
  C as authenticateWeb,
  z as createAndSetRole,
  V as createStructure,
  x as getConnectedUserId,
  u as getHeaders,
  K as getMetricValue,
  k as getRoleByName,
  U as getRolesOfStructure,
  O as getSchoolByName,
  B as getUsersOfSchool,
  L as linkRoleToUsers,
  j as searchUser
};
