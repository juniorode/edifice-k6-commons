var R = Object.defineProperty;
var U = (t, e, o) => e in t ? R(t, e, { enumerable: !0, configurable: !0, writable: !0, value: o }) : t[e] = o;
var h = (t, e, o) => (U(t, typeof e != "symbol" ? e + "" : e, o), o);
import a from "k6/http";
import { check as u, fail as O } from "k6";
import { FormData as $ } from "https://jslib.k6.io/formdata/0.0.2/index.js";
const y = {
  COOKIE: 0,
  OAUTH2: 1
};
class T {
  constructor(e, o, s, r) {
    h(this, "expiresAt");
    h(this, "token");
    h(this, "mode");
    h(this, "cookies");
    this.token = e, this.mode = o, this.cookies = r, this.expiresAt = Date.now() + s * 1e3 - 3e3;
  }
  isExpired() {
    return this.expiresAt <= Date.now();
  }
  getCookie(e) {
    return this.cookies ? this.cookies.filter((o) => o.name === e).map((o) => o.value)[0] : null;
  }
}
const w = __ENV.BASE_URL, N = 30 * 60, g = __ENV.ROOT_URL, d = function(t) {
  let e;
  return t ? t.mode === y.COOKIE ? e = { "x-xsrf-token": t.getCookie("XSRF-TOKEN") || "" } : t.mode === y.OAUTH2 ? e = { Authorization: `Bearer ${t.token}` } : e = {} : e = {}, e;
}, V = function(t, e) {
  const o = a.get(`${g}/conversation/visible?search=${t}`, {
    headers: d(e)
  });
  return u(o, {
    "should get an OK response": (r) => r.status == 200
  }), o.json("users")[0].id;
}, G = function(t) {
  const e = a.get(`${g}/auth/oauth2/userinfo`, {
    headers: d(t)
  });
  return u(e, {
    "should get an OK response": (o) => o.status == 200,
    "should get a valid userId": (o) => !!o.json("userId")
  }), e.json("userId");
}, F = function(t, e) {
  let o = {
    email: t,
    password: e,
    callBack: "",
    detail: ""
  };
  const s = a.post(`${g}/auth/login`, o, {
    redirects: 0
  });
  u(s, {
    "should redirect connected user to login page": (n) => n.status === 302,
    "should have set an auth cookie": (n) => n.cookies.oneSessionId !== null && n.cookies.oneSessionId !== void 0
  }), a.cookieJar().set(g, "oneSessionId", s.cookies.oneSessionId[0].value);
  const c = Object.keys(s.cookies).map((n) => ({ name: n, value: s.cookies[n][0].value }));
  return new T(
    s.cookies.oneSessionId[0].value,
    y.COOKIE,
    N,
    c
  );
}, H = function(t, e, o, s) {
  let r = {
    grant_type: "password",
    username: t,
    password: e,
    client_id: o,
    client_secret: s,
    scope: "timeline userbook blog lvs actualites pronote schoolbook support viescolaire zimbra conversation directory homeworks userinfo workspace portal cas sso presences incidents competences diary edt infra auth"
  }, c = a.post(`${g}/auth/oauth2/token`, r, {
    redirects: 0
  });
  u(c, {
    "should get an OK response for authentication": (i) => i.status == 200,
    "should have set an access token": (i) => !!i.json("access_token")
  });
  const n = c.json("access_token");
  return new T(
    n,
    y.OAUTH2,
    c.json("expires_in")
  );
};
function M(t, e) {
  const o = (e || []).map((s) => s.id);
  for (let s = 0; s < 1e3; s++) {
    const r = t[Math.floor(Math.random() * t.length)];
    if (o.indexOf(r.id) < 0)
      return r;
  }
  throw "cannot.find.random.user";
}
const z = function(t, e) {
  const o = a.get(`${w}/metrics`, {
    headers: d(e)
  });
  u(o, {
    "should get an OK response": (r) => r.status == 200
  });
  const s = o.body.split(`
`);
  for (let r of s)
    if (r.indexOf(`${t} `) === 0)
      return parseFloat(r.substring(t.length + 1).trim());
  return console.error("Metric", t, "not found"), null;
}, p = __ENV.ROOT_URL;
function k(t, e) {
  let o = a.get(`${p}/directory/structure/admin/list`, {
    headers: d(e)
  });
  return JSON.parse(o.body).filter(
    (s) => s.name === t
  )[0];
}
function L(t, e) {
  let o = a.get(`${p}/directory/structure/${t.id}/users`, {
    headers: d(e)
  });
  if (o.status !== 200)
    throw `Impossible to get users of ${t.id}`;
  return JSON.parse(o.body);
}
function D(t, e) {
  let o = a.get(`${p}/directory/structure/${t.id}/users`, {
    headers: d(e)
  });
  o.status != 200 && O(`Cannot fetch users of structure ${t.id} : ${o}`);
  const s = JSON.parse(o.body);
  for (let r = 0; r < s.length; r++) {
    const c = s[r];
    x(c);
  }
}
function x(t) {
  if (t.code) {
    const e = {};
    e.login = t.login, e.activationCode = t.code, e.password = "password", e.confirmPassword = "password", e.acceptCGU = "true";
    const o = a.post(`${p}/auth/activation`, e, {
      redirects: 0,
      headers: { Host: "localhost" }
    });
    o.status !== 302 && O(`Could not activate user ${t.login} : ${o}`);
  }
}
function W(t, e, o, s) {
  const c = _(t.id, s).filter(
    (n) => o.indexOf(n.name) >= 0
  );
  for (let n of c)
    if (n.roles.indexOf(e.name) >= 0)
      console.log("Role already attributed to teachers");
    else {
      const i = d(s);
      i["content-type"] = "application/json";
      const f = { headers: i }, l = JSON.stringify({
        groupId: n.id,
        roleIds: (n.roles || []).concat([e.id])
      }), b = a.post(
        `${p}/appregistry/authorize/group?schoolId=${t.id}`,
        l,
        f
      );
      u(b, {
        "link role to structure": (I) => I.status == 200
      });
    }
}
function q(t, e, o) {
  let s = k(t, o);
  if (s)
    console.log("School already exists");
  else {
    const r = new $();
    r.append("type", "CSV"), r.append("structureName", t);
    let c, n, i;
    "teachers" in e ? (c = e.teachers, n = e.students, i = e.responsables) : c = e, r.append("Teacher", a.file(c, "enseignants.csv")), n && r.append("Student", a.file(n, "eleves.csv")), i && r.append("Relative", a.file(i, "responsables.csv"));
    const f = d(o);
    f["Content-Type"] = "multipart/form-data; boundary=" + r.boundary;
    const l = { headers: f };
    a.post(
      `${p}/directory/wizard/import`,
      r.body(),
      l
    ).status != 200 && O(`Could not create structure ${t}`), s = k(t, o);
  }
  return s;
}
function P(t, e, o) {
  const s = new $();
  s.append("type", "CSV"), s.append("structureName", t.name), s.append("structureId", t.id), s.append("structureExternalId", t.externalId);
  let r, c, n;
  "teachers" in e ? (r = e.teachers, c = e.students, n = e.responsables) : r = e, s.append("Teacher", a.file(r, "enseignants.csv")), c && s.append("Student", a.file(c, "eleves.csv")), n && s.append("Relative", a.file(n, "responsables.csv"));
  const i = d(o);
  i["Content-Type"] = "multipart/form-data; boundary=" + s.boundary;
  const f = { headers: i };
  return a.post(
    `${p}/directory/wizard/import`,
    s.body(),
    f
  );
}
function S(t, e, o) {
  const s = d(o);
  s["content-type"] = "application/json";
  let r = a.get(
    `${p}/directory/group/admin/list?translate=false&structureId=${e.id}`,
    { headers: s }
  );
  return JSON.parse(r.body).filter(
    (c) => c.subType === "BroadcastGroup" && c.name === t
  )[0];
}
function X(t, e, o) {
  let s = S(t, e, o);
  if (s)
    console.log("Broadcast group already existed");
  else {
    console.log("Creating broadcast group");
    const r = d(o);
    r["content-type"] = "application/json";
    let c = JSON.stringify({
      name: t,
      structureId: e.id,
      subType: "BroadcastGroup"
    }), n = a.post(`${p}/directory/group`, c, { headers: r });
    u(n, {
      "create broadcast group": (l) => l.status === 201
    });
    const i = JSON.parse(n.body).id;
    c = JSON.stringify({
      name: t,
      autolinkTargetAllStructs: !0,
      autolinkTargetStructs: [],
      autolinkUsersFromGroups: ["Teacher"]
    }), n = a.put(`${p}/directory/group/${i}`, c, { headers: r }), u(n, {
      "set broadcast group for teachers": (l) => l.status === 200
    });
    const f = C(e, o).id;
    n = a.post(
      `${p}/communication/v2/group/${f}/communique/${i}`,
      "{}",
      { headers: r }
    ), u(n, {
      "open comm rule for broadcast group for teachers": (l) => l.status === 200
    }), s = S(t, e, o);
  }
  return s;
}
function C(t, e) {
  return _(t.id, e).filter(
    (s) => s.name === `Teachers from group ${t.name}.` || s.name === `Enseignants du groupe ${t.name}.`
  )[0];
}
const m = __ENV.ROOT_URL;
function v(t, e) {
  let o = a.get(`${m}/appregistry/roles`, {
    headers: d(e)
  });
  return JSON.parse(o.body).filter((r) => r.name === t)[0];
}
function Y(t, e) {
  const o = `${t} - All - Stress Test`;
  let s = v(o, e);
  if (s)
    console.log(`Role ${o} already existed`);
  else {
    let r = a.get(
      `${m}/appregistry/applications/actions?actionType=WORKFLOW`,
      { headers: d(e) }
    );
    u(r, { "get workflow actions": (l) => l.status == 200 });
    const n = JSON.parse(r.body).filter(
      (l) => l.name === t
    )[0].actions.map((l) => l[0]), i = d(e);
    i["content-type"] = "application/json";
    const f = {
      role: o,
      actions: n
    };
    r = a.post(`${m}/appregistry/role`, JSON.stringify(f), {
      headers: i
    }), console.log(r), u(r, { "save role ok": (l) => l.status == 201 }), s = v(o, e);
  }
  return s;
}
function _(t, e) {
  let o = a.get(
    `${m}/appregistry/groups/roles?structureId=${t}`,
    { headers: d(e) }
  );
  return u(o, {
    "get structure roles should be ok": (s) => s.status == 200
  }), JSON.parse(o.body);
}
const E = __ENV.ROOT_URL;
function Q(t, e) {
  let o = d(e);
  const s = new $();
  s.append("file", a.file(t, "file.txt")), o["Content-Type"] = "multipart/form-data; boundary=" + s.boundary;
  let r = a.post(`${E}/workspace/document`, s.body(), { headers: o });
  return u(r, {
    "upload doc ok": (c) => c.status === 201
  }), JSON.parse(r.body);
}
const A = __ENV.ROOT_URL;
function Z(t, e, o) {
  const s = d(o);
  s["content-type"] = "application/json";
  const r = JSON.stringify(e);
  return a.put(`${A}/workspace/share/resource/${t}`, r, {
    headers: s
  });
}
export {
  w as BASE_URL,
  T as Session,
  y as SessionMode,
  x as activateUser,
  D as activateUsers,
  H as authenticateOAuth2,
  F as authenticateWeb,
  Y as createAndSetRole,
  X as createBroadcastGroup,
  q as createStructure,
  S as getBroadcastGroup,
  G as getConnectedUserId,
  d as getHeaders,
  z as getMetricValue,
  M as getRandomUser,
  v as getRoleByName,
  _ as getRolesOfStructure,
  k as getSchoolByName,
  L as getUsersOfSchool,
  P as importUsers,
  W as linkRoleToUsers,
  V as searchUser,
  Z as shareFile,
  Q as uploadFile
};
