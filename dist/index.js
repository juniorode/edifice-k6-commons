var T = Object.defineProperty;
var U = (t, e, o) => e in t ? T(t, e, { enumerable: !0, configurable: !0, writable: !0, value: o }) : t[e] = o;
var h = (t, e, o) => (U(t, typeof e != "symbol" ? e + "" : e, o), o);
import a from "k6/http";
import { check as d, fail as $ } from "k6";
import { FormData as O } from "https://jslib.k6.io/formdata/0.0.2/index.js";
const m = {
  COOKIE: 0,
  OAUTH2: 1
};
class _ {
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
const I = __ENV.BASE_URL, N = 30 * 60, g = __ENV.ROOT_URL, u = function(t) {
  let e;
  return t ? t.mode === m.COOKIE ? e = { "x-xsrf-token": t.getCookie("XSRF-TOKEN") || "" } : t.mode === m.OAUTH2 ? e = { Authorization: `Bearer ${t.token}` } : e = {} : e = {}, e;
}, K = function(t, e) {
  const o = a.get(`${g}/conversation/visible?search=${t}`, {
    headers: u(e)
  });
  return d(o, {
    "should get an OK response": (r) => r.status == 200
  }), o.json("users")[0].id;
}, H = function(t) {
  const e = a.get(`${g}/auth/oauth2/userinfo`, {
    headers: u(t)
  });
  return d(e, {
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
  const s = a.post(`${g}/auth/login`, o, {
    redirects: 0
  });
  d(s, {
    "should redirect connected user to login page": (n) => n.status === 302,
    "should have set an auth cookie": (n) => n.cookies.oneSessionId !== null && n.cookies.oneSessionId !== void 0
  }), a.cookieJar().set(g, "oneSessionId", s.cookies.oneSessionId[0].value);
  const c = Object.keys(s.cookies).map((n) => ({ name: n, value: s.cookies[n][0].value }));
  return new _(
    s.cookies.oneSessionId[0].value,
    m.COOKIE,
    N,
    c
  );
}, M = function(t, e, o, s) {
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
  d(c, {
    "should get an OK response for authentication": (i) => i.status == 200,
    "should have set an access token": (i) => !!i.json("access_token")
  });
  const n = c.json("access_token");
  return new _(
    n,
    m.OAUTH2,
    c.json("expires_in")
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
  const o = a.get(`${I}/metrics`, {
    headers: u(e)
  });
  d(o, {
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
    headers: u(e)
  });
  return JSON.parse(o.body).filter(
    (s) => s.name === t
  )[0];
}
function D(t, e) {
  let o = a.get(`${p}/directory/structure/${t.id}/users`, {
    headers: u(e)
  });
  if (o.status !== 200)
    throw `Impossible to get users of ${t.id}`;
  return JSON.parse(o.body);
}
function W(t, e) {
  let o = a.get(`${p}/directory/structure/${t.id}/users`, {
    headers: u(e)
  });
  o.status != 200 && $(`Cannot fetch users of structure ${t.id} : ${o}`);
  const s = JSON.parse(o.body);
  for (let r = 0; r < s.length; r++) {
    const c = s[r];
    C(c);
  }
}
function C(t) {
  if (t.code) {
    const e = {};
    e.login = t.login, e.activationCode = t.code, e.password = "password", e.confirmPassword = "password", e.acceptCGU = "true";
    const o = a.post(`${p}/auth/activation`, e, {
      redirects: 0,
      headers: { Host: "localhost" }
    });
    o.status !== 302 && $(`Could not activate user ${t.login} : ${o}`);
  }
}
function q(t, e, o, s) {
  const c = R(t.id, s).filter(
    (n) => o.indexOf(n.name) >= 0
  );
  for (let n of c)
    if (n.roles.indexOf(e.name) >= 0)
      console.log("Role already attributed to teachers");
    else {
      const i = u(s);
      i["content-type"] = "application/json";
      const f = { headers: i }, l = JSON.stringify({
        groupId: n.id,
        roleIds: (n.roles || []).concat([e.id])
      }), b = a.post(
        `${p}/appregistry/authorize/group?schoolId=${t.id}`,
        l,
        f
      );
      d(b, {
        "link role to structure": (w) => w.status == 200
      });
    }
}
function P(t, e, o) {
  let s = k(t, o);
  if (s)
    console.log("School already exists");
  else {
    const r = new O();
    r.append("type", "CSV"), r.append("structureName", t);
    let c, n, i;
    "teachers" in e ? (c = e.teachers, n = e.students, i = e.responsables) : c = e, r.append("Teacher", a.file(c, "enseignants.csv")), n && r.append("Student", a.file(n, "eleves.csv")), i && r.append("Relative", a.file(i, "responsables.csv"));
    const f = u(o);
    f["Content-Type"] = "multipart/form-data; boundary=" + r.boundary;
    const l = { headers: f };
    a.post(
      `${p}/directory/wizard/import`,
      r.body(),
      l
    ).status != 200 && $(`Could not create structure ${t}`), s = k(t, o);
  }
  return s;
}
function X(t, e, o) {
  const s = new O();
  s.append("type", "CSV"), s.append("structureName", t.name), s.append("structureId", t.id), s.append("structureExternalId", t.externalId);
  let r, c, n;
  "teachers" in e ? (r = e.teachers, c = e.students, n = e.responsables) : r = e, s.append("Teacher", a.file(r, "enseignants.csv")), c && s.append("Student", a.file(c, "eleves.csv")), n && s.append("Relative", a.file(n, "responsables.csv"));
  const i = u(o);
  i["Content-Type"] = "multipart/form-data; boundary=" + s.boundary;
  const f = { headers: i };
  return a.post(
    `${p}/directory/wizard/import`,
    s.body(),
    f
  );
}
function S(t, e, o) {
  const s = u(o);
  s["content-type"] = "application/json";
  let r = a.get(
    `${p}/directory/group/admin/list?translate=false&structureId=${e.id}`,
    { headers: s }
  );
  return JSON.parse(r.body).filter(
    (c) => c.subType === "BroadcastGroup" && c.name === t
  )[0];
}
function Y(t, e, o) {
  let s = S(t, e, o);
  if (s)
    console.log("Broadcast group already existed");
  else {
    console.log("Creating broadcast group");
    const r = u(o);
    r["content-type"] = "application/json";
    let c = JSON.stringify({
      name: t,
      structureId: e.id,
      subType: "BroadcastGroup"
    }), n = a.post(`${p}/directory/group`, c, { headers: r });
    d(n, {
      "create broadcast group": (l) => l.status === 201
    });
    const i = JSON.parse(n.body).id;
    c = JSON.stringify({
      name: t,
      autolinkTargetAllStructs: !0,
      autolinkTargetStructs: [],
      autolinkUsersFromGroups: ["Teacher"]
    }), n = a.put(`${p}/directory/group/${i}`, c, { headers: r }), d(n, {
      "set broadcast group for teachers": (l) => l.status === 200
    });
    const f = E(e, o).id;
    n = a.post(
      `${p}/communication/v2/group/${f}/communique/${i}`,
      "{}",
      { headers: r }
    ), d(n, {
      "open comm rule for broadcast group for teachers": (l) => l.status === 200
    }), s = S(t, e, o);
  }
  return s;
}
function E(t, e) {
  return R(t.id, e).filter(
    (s) => s.name === `Teachers from group ${t.name}.` || s.name === `Enseignants du groupe ${t.name}.`
  )[0];
}
const y = __ENV.ROOT_URL;
function v(t, e) {
  let o = a.get(`${y}/appregistry/roles`, {
    headers: u(e)
  });
  return JSON.parse(o.body).filter((r) => r.name === t)[0];
}
function Q(t, e) {
  const o = `${t} - All - Stress Test`;
  let s = v(o, e);
  if (s)
    console.log(`Role ${o} already existed`);
  else {
    let r = a.get(
      `${y}/appregistry/applications/actions?actionType=WORKFLOW`,
      { headers: u(e) }
    );
    d(r, { "get workflow actions": (l) => l.status == 200 });
    const n = JSON.parse(r.body).filter(
      (l) => l.name === t
    )[0].actions.map((l) => l[0]), i = u(e);
    i["content-type"] = "application/json";
    const f = {
      role: o,
      actions: n
    };
    r = a.post(`${y}/appregistry/role`, JSON.stringify(f), {
      headers: i
    }), console.log(r), d(r, { "save role ok": (l) => l.status == 201 }), s = v(o, e);
  }
  return s;
}
function R(t, e) {
  let o = a.get(
    `${y}/appregistry/groups/roles?structureId=${t}`,
    { headers: u(e) }
  );
  return d(o, {
    "get structure roles should be ok": (s) => s.status == 200
  }), JSON.parse(o.body);
}
const x = __ENV.ROOT_URL;
function Z(t, e) {
  let o = u(e);
  const s = new O();
  s.append("file", a.file(t, "file.txt")), o["Content-Type"] = "multipart/form-data; boundary=" + s.boundary;
  let r = a.post(`${x}/workspace/document`, s.body(), { headers: o });
  return d(r, {
    "upload doc ok": (c) => c.status === 201
  }), JSON.parse(r.body);
}
const A = __ENV.ROOT_URL;
function ee(t, e, o) {
  const s = u(o);
  s["content-type"] = "application/json";
  const r = JSON.stringify(e);
  return a.put(`${A}/workspace/share/resource/${t}`, r, {
    headers: s
  });
}
const J = __ENV.ROOT_URL;
function te(t, e, o) {
  const s = a.post(
    `${J}/communication/v2/group/${t}/communique/${e}`,
    "{}",
    { headers: u(o) }
  );
  return s.status !== 200 && (console.error(
    `Error while adding communication between ${t} -> ${e}`
  ), console.error(s), $(`could not add communication between ${t} -> ${e}`)), s;
}
export {
  I as BASE_URL,
  _ as Session,
  m as SessionMode,
  C as activateUser,
  W as activateUsers,
  te as addCommunicationBetweenGroups,
  M as authenticateOAuth2,
  L as authenticateWeb,
  Q as createAndSetRole,
  Y as createBroadcastGroup,
  P as createStructure,
  S as getBroadcastGroup,
  H as getConnectedUserId,
  u as getHeaders,
  F as getMetricValue,
  z as getRandomUser,
  v as getRoleByName,
  R as getRolesOfStructure,
  k as getSchoolByName,
  E as getTeacherRole,
  D as getUsersOfSchool,
  X as importUsers,
  q as linkRoleToUsers,
  K as searchUser,
  ee as shareFile,
  Z as uploadFile
};
