var T = Object.defineProperty;
var U = (t, e, o) => e in t ? T(t, e, { enumerable: !0, configurable: !0, writable: !0, value: o }) : t[e] = o;
var g = (t, e, o) => (U(t, typeof e != "symbol" ? e + "" : e, o), o);
import i from "k6/http";
import { check as u, fail as h } from "k6";
import { FormData as b } from "https://jslib.k6.io/formdata/0.0.2/index.js";
const m = {
  COOKIE: 0,
  OAUTH2: 1
};
class _ {
  constructor(e, o, s, r) {
    g(this, "expiresAt");
    g(this, "token");
    g(this, "mode");
    g(this, "cookies");
    this.token = e, this.mode = o, this.cookies = r, this.expiresAt = Date.now() + s * 1e3 - 3e3;
  }
  isExpired() {
    return this.expiresAt <= Date.now();
  }
  getCookie(e) {
    return this.cookies ? this.cookies.filter((o) => o.name === e).map((o) => o.value)[0] : null;
  }
}
const I = __ENV.BASE_URL, C = 30 * 60, y = __ENV.ROOT_URL, c = function(t) {
  let e;
  return t ? t.mode === m.COOKIE ? e = { "x-xsrf-token": t.getCookie("XSRF-TOKEN") || "" } : t.mode === m.OAUTH2 ? e = { Authorization: `Bearer ${t.token}` } : e = {} : e = {}, e;
}, K = function(t, e) {
  const o = i.get(`${y}/conversation/visible?search=${t}`, {
    headers: c(e)
  });
  return u(o, {
    "should get an OK response": (r) => r.status == 200
  }), o.json("users")[0].id;
}, H = function(t) {
  const e = i.get(`${y}/auth/oauth2/userinfo`, {
    headers: c(t)
  });
  return u(e, {
    "should get an OK response": (o) => o.status == 200,
    "should get a valid userId": (o) => !!o.json("userId")
  }), e.json("userId");
}, L = function(t, e) {
  let o = {
    email: t,
    password: e,
    callBack: "",
    detail: ""
  };
  const s = i.post(`${y}/auth/login`, o, {
    redirects: 0
  });
  u(s, {
    "should redirect connected user to login page": (n) => n.status === 302,
    "should have set an auth cookie": (n) => n.cookies.oneSessionId !== null && n.cookies.oneSessionId !== void 0
  }), i.cookieJar().set(y, "oneSessionId", s.cookies.oneSessionId[0].value);
  const a = Object.keys(s.cookies).map((n) => ({ name: n, value: s.cookies[n][0].value }));
  return new _(
    s.cookies.oneSessionId[0].value,
    m.COOKIE,
    C,
    a
  );
}, M = function(t, e, o, s) {
  let r = {
    grant_type: "password",
    username: t,
    password: e,
    client_id: o,
    client_secret: s,
    scope: "timeline userbook blog lvs actualites pronote schoolbook support viescolaire zimbra conversation directory homeworks userinfo workspace portal cas sso presences incidents competences diary edt infra auth"
  }, a = i.post(`${y}/auth/oauth2/token`, r, {
    redirects: 0
  });
  u(a, {
    "should get an OK response for authentication": (l) => l.status == 200,
    "should have set an access token": (l) => !!l.json("access_token")
  });
  const n = a.json("access_token");
  return new _(
    n,
    m.OAUTH2,
    a.json("expires_in")
  );
};
function z(t, e) {
  const o = (e || []).map((s) => s.id);
  for (let s = 0; s < 1e3; s++) {
    const r = t[Math.floor(Math.random() * t.length)];
    if (o.indexOf(r.id) < 0)
      return r;
  }
  throw "cannot.find.random.user";
}
const F = function(t, e) {
  const o = i.get(`${I}/metrics`, {
    headers: c(e)
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
function $(t, e) {
  let o = i.get(`${p}/directory/structure/admin/list`, {
    headers: c(e)
  });
  return JSON.parse(o.body).filter(
    (s) => s.name === t
  )[0];
}
function D(t, e) {
  let o = i.get(`${p}/directory/structure/${t.id}/users`, {
    headers: c(e)
  });
  if (o.status !== 200)
    throw `Impossible to get users of ${t.id}`;
  return JSON.parse(o.body);
}
function W(t, e) {
  let o = i.get(`${p}/directory/structure/${t.id}/users`, {
    headers: c(e)
  });
  o.status != 200 && h(`Cannot fetch users of structure ${t.id} : ${o}`);
  const s = JSON.parse(o.body);
  for (let r = 0; r < s.length; r++) {
    const a = s[r];
    x(a);
  }
}
function x(t) {
  if (t.code) {
    const e = {};
    e.login = t.login, e.activationCode = t.code, e.password = "password", e.confirmPassword = "password", e.acceptCGU = "true";
    const o = i.post(`${p}/auth/activation`, e, {
      redirects: 0,
      headers: { Host: "localhost" }
    });
    o.status !== 302 && h(`Could not activate user ${t.login} : ${o}`);
  }
}
function q(t, e, o, s) {
  const a = R(t.id, s).filter(
    (n) => o.indexOf(n.name) >= 0
  );
  for (let n of a)
    if (n.roles.indexOf(e.name) >= 0)
      console.log("Role already attributed to teachers");
    else {
      const l = c(s);
      l["content-type"] = "application/json";
      const f = { headers: l }, d = JSON.stringify({
        groupId: n.id,
        roleIds: (n.roles || []).concat([e.id])
      }), k = i.post(
        `${p}/appregistry/authorize/group?schoolId=${t.id}`,
        d,
        f
      );
      u(k, {
        "link role to structure": (w) => w.status == 200
      });
    }
}
function P(t, e, o) {
  let s = $(t, o);
  if (s)
    console.log(`Structure ${t} already exists`);
  else {
    const r = c(o);
    r["content-type"] = "application/json";
    const a = JSON.stringify({
      hasApp: e,
      name: t
    });
    let n = i.post(`${p}/directory/school`, a, r);
    n.status !== 201 && (console.error(n.body), h(`Could not create structure ${t}`)), s = $(t, o);
  }
  return s;
}
function X(t, e, o) {
  let s = $(t, o);
  if (s)
    console.log("School already exists");
  else {
    const r = new b();
    r.append("type", "CSV"), r.append("structureName", t);
    let a, n, l;
    "teachers" in e ? (a = e.teachers, n = e.students, l = e.responsables) : a = e, r.append("Teacher", i.file(a, "enseignants.csv")), n && r.append("Student", i.file(n, "eleves.csv")), l && r.append("Relative", i.file(l, "responsables.csv"));
    const f = c(o);
    f["Content-Type"] = "multipart/form-data; boundary=" + r.boundary;
    const d = { headers: f };
    i.post(
      `${p}/directory/wizard/import`,
      r.body(),
      d
    ).status != 200 && h(`Could not create structure ${t}`), s = $(t, o);
  }
  return s;
}
function Y(t, e, o) {
  let s;
  if ((e.parents || []).map((a) => a.id).indexOf(t.id) >= 0)
    console.log(
      `${e.name} is already a child of ${t.name}`
    ), s = !1;
  else {
    const a = c(o);
    a["content-type"] = "application/json", i.put(
      `${p}/directory/structure/${e.id}/parent/${t.id}`,
      "{}"
    ).status !== 200 && h(
      `Could not attach structure ${e.name} as a child of ${t.name}`
    ), s = !0;
  }
  return s;
}
function Q(t, e, o) {
  const s = new b();
  s.append("type", "CSV"), s.append("structureName", t.name), s.append("structureId", t.id), s.append("structureExternalId", t.externalId);
  let r, a, n;
  "teachers" in e ? (r = e.teachers, a = e.students, n = e.responsables) : r = e, s.append("Teacher", i.file(r, "enseignants.csv")), a && s.append("Student", i.file(a, "eleves.csv")), n && s.append("Relative", i.file(n, "responsables.csv"));
  const l = c(o);
  l["Content-Type"] = "multipart/form-data; boundary=" + s.boundary;
  const f = { headers: l };
  return i.post(
    `${p}/directory/wizard/import`,
    s.body(),
    f
  );
}
function S(t, e, o) {
  const s = c(o);
  s["content-type"] = "application/json";
  let r = i.get(
    `${p}/directory/group/admin/list?translate=false&structureId=${e.id}`,
    { headers: s }
  );
  return JSON.parse(r.body).filter(
    (a) => a.subType === "BroadcastGroup" && a.name === t
  )[0];
}
function Z(t, e, o) {
  let s = S(t, e, o);
  if (s)
    console.log("Broadcast group already existed");
  else {
    console.log("Creating broadcast group");
    const r = c(o);
    r["content-type"] = "application/json";
    let a = JSON.stringify({
      name: t,
      structureId: e.id,
      subType: "BroadcastGroup"
    }), n = i.post(`${p}/directory/group`, a, { headers: r });
    u(n, {
      "create broadcast group": (d) => d.status === 201
    });
    const l = JSON.parse(n.body).id;
    a = JSON.stringify({
      name: t,
      autolinkTargetAllStructs: !0,
      autolinkTargetStructs: [],
      autolinkUsersFromGroups: ["Teacher"]
    }), n = i.put(`${p}/directory/group/${l}`, a, { headers: r }), u(n, {
      "set broadcast group for teachers": (d) => d.status === 200
    });
    const f = E(e, o).id;
    n = i.post(
      `${p}/communication/v2/group/${f}/communique/${l}`,
      "{}",
      { headers: r }
    ), u(n, {
      "open comm rule for broadcast group for teachers": (d) => d.status === 200
    }), s = S(t, e, o);
  }
  return s;
}
function E(t, e) {
  return R(t.id, e).filter(
    (s) => s.name === `Teachers from group ${t.name}.` || s.name === `Enseignants du groupe ${t.name}.`
  )[0];
}
const O = __ENV.ROOT_URL;
function v(t, e) {
  let o = i.get(`${O}/appregistry/roles`, {
    headers: c(e)
  });
  return JSON.parse(o.body).filter((r) => r.name === t)[0];
}
function ee(t, e) {
  const o = `${t} - All - Stress Test`;
  let s = v(o, e);
  if (s)
    console.log(`Role ${o} already existed`);
  else {
    let r = i.get(
      `${O}/appregistry/applications/actions?actionType=WORKFLOW`,
      { headers: c(e) }
    );
    u(r, { "get workflow actions": (d) => d.status == 200 });
    const n = JSON.parse(r.body).filter(
      (d) => d.name === t
    )[0].actions.map((d) => d[0]), l = c(e);
    l["content-type"] = "application/json";
    const f = {
      role: o,
      actions: n
    };
    r = i.post(`${O}/appregistry/role`, JSON.stringify(f), {
      headers: l
    }), console.log(r), u(r, { "save role ok": (d) => d.status == 201 }), s = v(o, e);
  }
  return s;
}
function R(t, e) {
  let o = i.get(
    `${O}/appregistry/groups/roles?structureId=${t}`,
    { headers: c(e) }
  );
  return u(o, {
    "get structure roles should be ok": (s) => s.status == 200
  }), JSON.parse(o.body);
}
const N = __ENV.ROOT_URL;
function te(t, e) {
  let o = c(e);
  const s = new b();
  s.append("file", i.file(t, "file.txt")), o["Content-Type"] = "multipart/form-data; boundary=" + s.boundary;
  let r = i.post(`${N}/workspace/document`, s.body(), { headers: o });
  return u(r, {
    "upload doc ok": (a) => a.status === 201
  }), JSON.parse(r.body);
}
const j = __ENV.ROOT_URL;
function oe(t, e, o) {
  const s = c(o);
  s["content-type"] = "application/json";
  const r = JSON.stringify(e);
  return i.put(`${j}/workspace/share/resource/${t}`, r, {
    headers: s
  });
}
const A = __ENV.ROOT_URL;
function se(t, e, o) {
  const s = i.post(
    `${A}/communication/v2/group/${t}/communique/${e}`,
    "{}",
    { headers: c(o) }
  );
  return s.status !== 200 && (console.error(
    `Error while adding communication between ${t} -> ${e}`
  ), console.error(s), h(`could not add communication between ${t} -> ${e}`)), s;
}
export {
  I as BASE_URL,
  _ as Session,
  m as SessionMode,
  x as activateUser,
  W as activateUsers,
  se as addCommunicationBetweenGroups,
  Y as attachStructureAsChild,
  M as authenticateOAuth2,
  L as authenticateWeb,
  ee as createAndSetRole,
  Z as createBroadcastGroup,
  P as createEmptyStructure,
  X as createStructure,
  S as getBroadcastGroup,
  H as getConnectedUserId,
  c as getHeaders,
  F as getMetricValue,
  z as getRandomUser,
  v as getRoleByName,
  R as getRolesOfStructure,
  $ as getSchoolByName,
  E as getTeacherRole,
  D as getUsersOfSchool,
  Q as importUsers,
  q as linkRoleToUsers,
  K as searchUser,
  oe as shareFile,
  te as uploadFile
};
