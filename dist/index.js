var v = Object.defineProperty;
var _ = (s, e, t) => e in s ? v(s, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : s[e] = t;
var f = (s, e, t) => (_(s, typeof e != "symbol" ? e + "" : e, t), t);
import c from "k6/http";
import { check as l } from "k6";
import { FormData as I } from "https://jslib.k6.io/formdata/0.0.2/index.js";
const O = {
  COOKIE: 0,
  OAUTH2: 1
};
class b {
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
  return s ? s.mode === O.COOKIE ? e = { "x-xsrf-token": s.getCookie("XSRF-TOKEN") || "" } : s.mode === O.OAUTH2 ? e = { Authorization: `Bearer ${s.token}` } : e = {} : e = {}, e;
}, E = function(s, e) {
  const t = c.get(`${g}/conversation/visible?search=${s}`, {
    headers: u(e)
  });
  return l(t, {
    "should get an OK response": (o) => o.status == 200
  }), t.json("users")[0].id;
}, j = function(s) {
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
    "should redirect connected user to login page": (n) => n.status === 302,
    "should have set an auth cookie": (n) => n.cookies.oneSessionId !== null && n.cookies.oneSessionId !== void 0
  }), c.cookieJar().set(g, "oneSessionId", r.cookies.oneSessionId[0].value);
  const a = Object.keys(r.cookies).map((n) => ({ name: n, value: r.cookies[n][0].value }));
  return new b(
    r.cookies.oneSessionId[0].value,
    O.COOKIE,
    w,
    a
  );
}, J = function(s, e, t, r) {
  let o = {
    grant_type: "password",
    username: s,
    password: e,
    client_id: t,
    client_secret: r,
    scope: "timeline userbook blog lvs actualites pronote schoolbook support viescolaire zimbra conversation directory homeworks userinfo workspace portal cas sso presences incidents competences diary edt infra auth"
  }, a = c.post(`${g}/auth/oauth2/token`, o, {
    redirects: 0
  });
  l(a, {
    "should get an OK response for authentication": (i) => i.status == 200,
    "should have set an access token": (i) => !!i.json("access_token")
  });
  const n = a.json("access_token");
  return new b(
    n,
    O.OAUTH2,
    a.json("expires_in")
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
function S(s, e) {
  let t = c.get(`${h}/directory/api/ecole`, {
    headers: u(e)
  });
  const r = JSON.parse(t.body).result;
  return Object.keys(r || {}).map((a) => r[a]).filter((a) => a.name === s)[0];
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
    const a = r[o];
    if (a.code) {
      const n = {};
      n.login = a.login, n.activationCode = a.code, n.password = "password", n.confirmPassword = "password", n.acceptCGU = "true", t = c.post(`${h}/auth/activation`, n, {
        redirects: 0,
        headers: { Host: "localhost" }
      }), l(t, {
        "activate user": (i) => i.status === 302
      });
    }
  }
}
function L(s, e, t, r) {
  const a = U(s.id, r).filter(
    (n) => t.indexOf(n.name) >= 0
  );
  for (let n of a)
    if (n.roles.indexOf(e.name) >= 0)
      console.log("Role already attributed to teachers");
    else {
      const i = u(r);
      i["content-type"] = "application/json";
      const p = { headers: i }, d = JSON.stringify({
        groupId: n.id,
        roleIds: (n.roles || []).concat([e.id])
      }), k = c.post(
        `${h}/appregistry/authorize/group?schoolId=${s.id}`,
        d,
        p
      );
      l(k, {
        "link role to structure": (m) => m.status == 200
      });
    }
}
function V(s, e, t) {
  let r = S(s, t);
  if (r)
    console.log("School already exists");
  else {
    const o = new I();
    o.append("type", "CSV"), o.append("structureName", s);
    let a, n, i;
    "teachers" in e ? (a = e.teachers, n = e.students, i = e.responsables) : a = e, o.append("Teacher", c.file(a, "enseignants.csv")), n && o.append("Student", c.file(n, "eleves.csv")), i && o.append("Relative", c.file(i, "responsables.csv"));
    const p = u(t);
    p["Content-Type"] = "multipart/form-data; boundary=" + o.boundary;
    const d = { headers: p }, k = c.post(
      `${h}/directory/wizard/import`,
      o.body(),
      d
    );
    l(k, {
      "import structure is ok": (m) => m.status == 200
    }), r = S(s, t);
  }
  return r;
}
const y = __ENV.ROOT_URL;
function $(s, e) {
  let t = c.get(`${y}/appregistry/roles`, {
    headers: u(e)
  });
  return JSON.parse(t.body).filter((o) => o.name === s)[0];
}
function z(s, e) {
  const t = `${s} - All - Stress Test`;
  let r = $(t, e);
  if (r)
    console.log(`Role ${t} already existed`);
  else {
    let o = c.get(
      `${y}/appregistry/applications/actions?actionType=WORKFLOW`,
      { headers: u(e) }
    );
    l(o, { "get workflow actions": (d) => d.status == 200 });
    const n = JSON.parse(o.body).filter(
      (d) => d.name === s
    )[0].actions.map((d) => d[0]), i = u(e);
    i["content-type"] = "application/json";
    const p = {
      role: t,
      actions: n
    };
    o = c.post(`${y}/appregistry/role`, JSON.stringify(p), {
      headers: i
    }), console.log(o), l(o, { "save role ok": (d) => d.status == 201 }), r = $(t, e);
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
  b as Session,
  O as SessionMode,
  H as activateUsers,
  J as authenticateOAuth2,
  C as authenticateWeb,
  z as createAndSetRole,
  V as createStructure,
  j as getConnectedUserId,
  u as getHeaders,
  K as getMetricValue,
  $ as getRoleByName,
  U as getRolesOfStructure,
  S as getSchoolByName,
  B as getUsersOfSchool,
  L as linkRoleToUsers,
  E as searchUser
};
