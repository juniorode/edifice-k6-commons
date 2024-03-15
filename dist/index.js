var T = Object.defineProperty;
var U = (e, t, o) => t in e ? T(e, t, { enumerable: !0, configurable: !0, writable: !0, value: o }) : e[t] = o;
var y = (e, t, o) => (U(e, typeof t != "symbol" ? t + "" : t, o), o);
import a from "k6/http";
import { check as u, fail as g } from "k6";
import { FormData as b } from "https://jslib.k6.io/formdata/0.0.2/index.js";
const m = {
  COOKIE: 0,
  OAUTH2: 1
};
class _ {
  constructor(t, o, s, r) {
    y(this, "expiresAt");
    y(this, "token");
    y(this, "mode");
    y(this, "cookies");
    this.token = t, this.mode = o, this.cookies = r, this.expiresAt = Date.now() + s * 1e3 - 3e3;
  }
  isExpired() {
    return this.expiresAt <= Date.now();
  }
  getCookie(t) {
    return this.cookies ? this.cookies.filter((o) => o.name === t).map((o) => o.value)[0] : null;
  }
}
const I = __ENV.BASE_URL, C = 30 * 60, h = __ENV.ROOT_URL, c = function(e) {
  let t;
  return e ? e.mode === m.COOKIE ? t = { "x-xsrf-token": e.getCookie("XSRF-TOKEN") || "" } : e.mode === m.OAUTH2 ? t = { Authorization: `Bearer ${e.token}` } : t = {} : t = {}, t;
}, K = function(e, t) {
  const o = a.get(`${h}/conversation/visible?search=${e}`, {
    headers: c(t)
  });
  return u(o, {
    "should get an OK response": (r) => r.status == 200
  }), o.json("users")[0].id;
}, H = function(e) {
  const t = a.get(`${h}/auth/oauth2/userinfo`, {
    headers: c(e)
  });
  return u(t, {
    "should get an OK response": (o) => o.status == 200,
    "should get a valid userId": (o) => !!o.json("userId")
  }), t.json("userId");
}, L = function(e, t) {
  let o = {
    email: e,
    password: t,
    callBack: "",
    detail: ""
  };
  const s = a.post(`${h}/auth/login`, o, {
    redirects: 0
  });
  u(s, {
    "should redirect connected user to login page": (n) => n.status === 302,
    "should have set an auth cookie": (n) => n.cookies.oneSessionId !== null && n.cookies.oneSessionId !== void 0
  }), a.cookieJar().set(h, "oneSessionId", s.cookies.oneSessionId[0].value);
  const i = Object.keys(s.cookies).map((n) => ({ name: n, value: s.cookies[n][0].value }));
  return new _(
    s.cookies.oneSessionId[0].value,
    m.COOKIE,
    C,
    i
  );
}, M = function(e) {
  return a.cookieJar().set(h, "oneSessionId", e.token), e;
}, z = function(e, t, o, s) {
  let r = {
    grant_type: "password",
    username: e,
    password: t,
    client_id: o,
    client_secret: s,
    scope: "timeline userbook blog lvs actualites pronote schoolbook support viescolaire zimbra conversation directory homeworks userinfo workspace portal cas sso presences incidents competences diary edt infra auth"
  }, i = a.post(`${h}/auth/oauth2/token`, r, {
    redirects: 0
  });
  u(i, {
    "should get an OK response for authentication": (l) => l.status == 200,
    "should have set an access token": (l) => !!l.json("access_token")
  });
  const n = i.json("access_token");
  return new _(
    n,
    m.OAUTH2,
    i.json("expires_in")
  );
};
function F(e, t) {
  const o = (t || []).map((s) => s.id);
  for (let s = 0; s < 1e3; s++) {
    const r = e[Math.floor(Math.random() * e.length)];
    if (o.indexOf(r.id) < 0)
      return r;
  }
  throw "cannot.find.random.user";
}
const D = function(e, t) {
  const o = a.get(`${I}/metrics`, {
    headers: c(t)
  });
  u(o, {
    "should get an OK response": (r) => r.status == 200
  });
  const s = o.body.split(`
`);
  for (let r of s)
    if (r.indexOf(`${e} `) === 0)
      return parseFloat(r.substring(e.length + 1).trim());
  return console.error("Metric", e, "not found"), null;
}, p = __ENV.ROOT_URL;
function $(e, t) {
  let o = a.get(`${p}/directory/structure/admin/list`, {
    headers: c(t)
  });
  return JSON.parse(o.body).filter(
    (s) => s.name === e
  )[0];
}
function W(e, t) {
  let o = a.get(`${p}/directory/structure/${e.id}/users`, {
    headers: c(t)
  });
  if (o.status !== 200)
    throw `Impossible to get users of ${e.id}`;
  return JSON.parse(o.body);
}
function q(e, t) {
  let o = a.get(`${p}/directory/structure/${e.id}/users`, {
    headers: c(t)
  });
  o.status != 200 && g(`Cannot fetch users of structure ${e.id} : ${o}`);
  const s = JSON.parse(o.body);
  for (let r = 0; r < s.length; r++) {
    const i = s[r];
    x(i);
  }
}
function x(e) {
  if (e.code) {
    const t = {};
    t.login = e.login, t.activationCode = e.code, t.password = "password", t.confirmPassword = "password", t.acceptCGU = "true";
    const o = a.post(`${p}/auth/activation`, t, {
      redirects: 0,
      headers: { Host: "localhost" }
    });
    o.status !== 302 && g(`Could not activate user ${e.login} : ${o}`);
  }
}
function P(e, t, o, s) {
  const i = w(e.id, s).filter(
    (n) => o.indexOf(n.name) >= 0
  );
  for (let n of i)
    if (n.roles.indexOf(t.name) >= 0)
      console.log("Role already attributed to teachers");
    else {
      const l = c(s);
      l["content-type"] = "application/json";
      const f = { headers: l }, d = JSON.stringify({
        groupId: n.id,
        roleIds: (n.roles || []).concat([t.id])
      }), k = a.post(
        `${p}/appregistry/authorize/group?schoolId=${e.id}`,
        d,
        f
      );
      u(k, {
        "link role to structure": (R) => R.status == 200
      });
    }
}
function X(e, t, o) {
  let s = $(e, o);
  if (s)
    console.log(`Structure ${e} already exists`);
  else {
    const r = c(o);
    r["content-type"] = "application/json";
    const i = JSON.stringify({
      hasApp: t,
      name: e
    });
    let n = a.post(`${p}/directory/school`, i, r);
    n.status !== 201 && (console.error(n.body), g(`Could not create structure ${e}`)), s = $(e, o);
  }
  return s;
}
function Y(e, t, o) {
  let s = $(e, o);
  if (s)
    console.log("School already exists");
  else {
    const r = new b();
    r.append("type", "CSV"), r.append("structureName", e);
    let i, n, l;
    "teachers" in t ? (i = t.teachers, n = t.students, l = t.responsables) : i = t, r.append("Teacher", a.file(i, "enseignants.csv")), n && r.append("Student", a.file(n, "eleves.csv")), l && r.append("Relative", a.file(l, "responsables.csv"));
    const f = c(o);
    f["Content-Type"] = "multipart/form-data; boundary=" + r.boundary;
    const d = { headers: f };
    a.post(
      `${p}/directory/wizard/import`,
      r.body(),
      d
    ).status != 200 && g(`Could not create structure ${e}`), s = $(e, o);
  }
  return s;
}
function Q(e, t, o) {
  let s;
  if ((t.parents || []).map((i) => i.id).indexOf(e.id) >= 0)
    console.log(
      `${t.name} is already a child of ${e.name}`
    ), s = !1;
  else {
    const i = c(o);
    i["content-type"] = "application/json", a.put(
      `${p}/directory/structure/${t.id}/parent/${e.id}`,
      "{}"
    ).status !== 200 && g(
      `Could not attach structure ${t.name} as a child of ${e.name}`
    ), s = !0;
  }
  return s;
}
function Z(e, t, o) {
  const s = new b();
  s.append("type", "CSV"), s.append("structureName", e.name), s.append("structureId", e.id), s.append("structureExternalId", e.externalId);
  let r, i, n;
  "teachers" in t ? (r = t.teachers, i = t.students, n = t.responsables) : r = t, s.append("Teacher", a.file(r, "enseignants.csv")), i && s.append("Student", a.file(i, "eleves.csv")), n && s.append("Relative", a.file(n, "responsables.csv"));
  const l = c(o);
  l["Content-Type"] = "multipart/form-data; boundary=" + s.boundary;
  const f = { headers: l };
  return a.post(
    `${p}/directory/wizard/import`,
    s.body(),
    f
  );
}
function S(e, t, o) {
  const s = c(o);
  s["content-type"] = "application/json";
  let r = a.get(
    `${p}/directory/group/admin/list?translate=false&structureId=${t.id}`,
    { headers: s }
  );
  return JSON.parse(r.body).filter(
    (i) => i.subType === "BroadcastGroup" && i.name === e
  )[0];
}
function ee(e, t, o) {
  let s = S(e, t, o);
  if (s)
    console.log("Broadcast group already existed");
  else {
    console.log("Creating broadcast group");
    const r = c(o);
    r["content-type"] = "application/json";
    let i = JSON.stringify({
      name: e,
      structureId: t.id,
      subType: "BroadcastGroup"
    }), n = a.post(`${p}/directory/group`, i, { headers: r });
    u(n, {
      "create broadcast group": (d) => d.status === 201
    });
    const l = JSON.parse(n.body).id;
    i = JSON.stringify({
      name: e,
      autolinkTargetAllStructs: !0,
      autolinkTargetStructs: [],
      autolinkUsersFromGroups: ["Teacher"]
    }), n = a.put(`${p}/directory/group/${l}`, i, { headers: r }), u(n, {
      "set broadcast group for teachers": (d) => d.status === 200
    });
    const f = E(t, o).id;
    n = a.post(
      `${p}/communication/v2/group/${f}/communique/${l}`,
      "{}",
      { headers: r }
    ), u(n, {
      "open comm rule for broadcast group for teachers": (d) => d.status === 200
    }), s = S(e, t, o);
  }
  return s;
}
function E(e, t) {
  return w(e.id, t).filter(
    (s) => s.name === `Teachers from group ${e.name}.` || s.name === `Enseignants du groupe ${e.name}.`
  )[0];
}
const O = __ENV.ROOT_URL;
function v(e, t) {
  let o = a.get(`${O}/appregistry/roles`, {
    headers: c(t)
  });
  return JSON.parse(o.body).filter((r) => r.name === e)[0];
}
function te(e, t) {
  const o = `${e} - All - Stress Test`;
  let s = v(o, t);
  if (s)
    console.log(`Role ${o} already existed`);
  else {
    let r = a.get(
      `${O}/appregistry/applications/actions?actionType=WORKFLOW`,
      { headers: c(t) }
    );
    u(r, { "get workflow actions": (d) => d.status == 200 });
    const n = JSON.parse(r.body).filter(
      (d) => d.name === e
    )[0].actions.map((d) => d[0]), l = c(t);
    l["content-type"] = "application/json";
    const f = {
      role: o,
      actions: n
    };
    r = a.post(`${O}/appregistry/role`, JSON.stringify(f), {
      headers: l
    }), console.log(r), u(r, { "save role ok": (d) => d.status == 201 }), s = v(o, t);
  }
  return s;
}
function w(e, t) {
  let o = a.get(
    `${O}/appregistry/groups/roles?structureId=${e}`,
    { headers: c(t) }
  );
  return u(o, {
    "get structure roles should be ok": (s) => s.status == 200
  }), JSON.parse(o.body);
}
const j = __ENV.ROOT_URL;
function oe(e, t) {
  let o = c(t);
  const s = new b();
  s.append("file", a.file(e, "file.txt")), o["Content-Type"] = "multipart/form-data; boundary=" + s.boundary;
  let r = a.post(`${j}/workspace/document`, s.body(), { headers: o });
  return u(r, {
    "upload doc ok": (i) => i.status === 201
  }), JSON.parse(r.body);
}
const J = __ENV.ROOT_URL;
function se(e, t, o) {
  const s = c(o);
  s["content-type"] = "application/json";
  const r = JSON.stringify(t);
  return a.put(`${J}/workspace/share/resource/${e}`, r, {
    headers: s
  });
}
const N = __ENV.ROOT_URL;
function re(e, t, o) {
  const s = a.post(
    `${N}/communication/v2/group/${e}/communique/${t}`,
    "{}",
    { headers: c(o) }
  );
  return s.status !== 200 && (console.error(
    `Error while adding communication between ${e} -> ${t}`
  ), console.error(s), g(`could not add communication between ${e} -> ${t}`)), s;
}
export {
  I as BASE_URL,
  _ as Session,
  m as SessionMode,
  x as activateUser,
  q as activateUsers,
  re as addCommunicationBetweenGroups,
  Q as attachStructureAsChild,
  z as authenticateOAuth2,
  L as authenticateWeb,
  te as createAndSetRole,
  ee as createBroadcastGroup,
  X as createEmptyStructure,
  Y as createStructure,
  S as getBroadcastGroup,
  H as getConnectedUserId,
  c as getHeaders,
  D as getMetricValue,
  F as getRandomUser,
  v as getRoleByName,
  w as getRolesOfStructure,
  $ as getSchoolByName,
  E as getTeacherRole,
  W as getUsersOfSchool,
  Z as importUsers,
  P as linkRoleToUsers,
  K as searchUser,
  se as shareFile,
  M as switchSession,
  oe as uploadFile
};
