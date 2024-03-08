var R = Object.defineProperty;
var I = (t, e, o) => e in t ? R(t, e, { enumerable: !0, configurable: !0, writable: !0, value: o }) : t[e] = o;
var g = (t, e, o) => (I(t, typeof e != "symbol" ? e + "" : e, o), o);
import a from "k6/http";
import { check as d, fail as $ } from "k6";
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
const U = __ENV.BASE_URL, w = 30 * 60, h = __ENV.ROOT_URL, u = function(t) {
  let e;
  return t ? t.mode === m.COOKIE ? e = { "x-xsrf-token": t.getCookie("XSRF-TOKEN") || "" } : t.mode === m.OAUTH2 ? e = { Authorization: `Bearer ${t.token}` } : e = {} : e = {}, e;
}, K = function(t, e) {
  const o = a.get(`${h}/conversation/visible?search=${t}`, {
    headers: u(e)
  });
  return d(o, {
    "should get an OK response": (r) => r.status == 200
  }), o.json("users")[0].id;
}, V = function(t) {
  const e = a.get(`${h}/auth/oauth2/userinfo`, {
    headers: u(t)
  });
  return d(e, {
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
  const s = a.post(`${h}/auth/login`, o, {
    redirects: 0
  });
  d(s, {
    "should redirect connected user to login page": (n) => n.status === 302,
    "should have set an auth cookie": (n) => n.cookies.oneSessionId !== null && n.cookies.oneSessionId !== void 0
  }), a.cookieJar().set(h, "oneSessionId", s.cookies.oneSessionId[0].value);
  const c = Object.keys(s.cookies).map((n) => ({ name: n, value: s.cookies[n][0].value }));
  return new _(
    s.cookies.oneSessionId[0].value,
    m.COOKIE,
    w,
    c
  );
}, G = function(t, e, o, s) {
  let r = {
    grant_type: "password",
    username: t,
    password: e,
    client_id: o,
    client_secret: s,
    scope: "timeline userbook blog lvs actualites pronote schoolbook support viescolaire zimbra conversation directory homeworks userinfo workspace portal cas sso presences incidents competences diary edt infra auth"
  }, c = a.post(`${h}/auth/oauth2/token`, r, {
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
function H(t, e) {
  const o = (e || []).map((s) => s.id);
  for (let s = 0; s < 1e3; s++) {
    const r = t[Math.floor(Math.random() * t.length)];
    if (o.indexOf(r.id) < 0)
      return r;
  }
  throw "cannot.find.random.user";
}
const L = function(t, e) {
  const o = a.get(`${U}/metrics`, {
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
  let o = a.get(`${p}/directory/api/ecole`, {
    headers: u(e)
  });
  const s = JSON.parse(o.body).result;
  return Object.keys(s || {}).map((c) => s[c]).filter((c) => c.name === t)[0];
}
function M(t, e) {
  let o = a.get(`${p}/directory/structure/${t.id}/users`, {
    headers: u(e)
  });
  if (o.status !== 200)
    throw `Impossible to get users of ${t.id}`;
  return JSON.parse(o.body);
}
function z(t, e) {
  let o = a.get(`${p}/directory/structure/${t.id}/users`, {
    headers: u(e)
  });
  o.status != 200 && $(`Cannot fetch users of structure ${t.id} : ${o}`);
  const s = JSON.parse(o.body);
  for (let r = 0; r < s.length; r++) {
    const c = s[r];
    N(c);
  }
}
function N(t) {
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
function D(t, e, o, s) {
  const c = v(t.id, s).filter(
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
      }), y = a.post(
        `${p}/appregistry/authorize/group?schoolId=${t.id}`,
        l,
        f
      );
      d(y, {
        "link role to structure": (T) => T.status == 200
      });
    }
}
function W(t, e, o) {
  let s = k(t, o);
  if (s)
    console.log("School already exists");
  else {
    const r = new b();
    r.append("type", "CSV"), r.append("structureName", t);
    let c, n, i;
    "teachers" in e ? (c = e.teachers, n = e.students, i = e.responsables) : c = e, r.append("Teacher", a.file(c, "enseignants.csv")), n && r.append("Student", a.file(n, "eleves.csv")), i && r.append("Relative", a.file(i, "responsables.csv"));
    const f = u(o);
    f["Content-Type"] = "multipart/form-data; boundary=" + r.boundary;
    const l = { headers: f }, y = a.post(
      `${p}/directory/wizard/import`,
      r.body(),
      l
    );
    y.status != 200 && (console.error(`Could not create structure ${t}`, y), $(`Could not create structure ${t}`)), s = k(t, o);
  }
  return s;
}
function q(t, e, o) {
  const s = u(o);
  s["content-type"] = "application/json";
  let r = a.get(
    `${p}/directory/group/admin/list?translate=false&structureId=${e.id}`,
    { headers: s }
  ), c = JSON.parse(r.body).filter(
    (n) => n.subType === "BroadcastGroup" && n.name === t
  )[0];
  if (c)
    console.log("Broadcast group already existed");
  else {
    console.log("Creating broadcast group");
    let n = JSON.stringify({
      name: t,
      structureId: e.id,
      subType: "BroadcastGroup"
    });
    r = a.post(`${p}/directory/group`, n, { headers: s }), d(r, {
      "create broadcast group": (l) => l.status === 201
    });
    const i = JSON.parse(r.body).id;
    n = JSON.stringify({
      name: t,
      autolinkTargetAllStructs: !0,
      autolinkTargetStructs: [],
      autolinkUsersFromGroups: ["Teacher"]
    }), r = a.put(`${p}/directory/group/${i}`, n, { headers: s }), d(r, {
      "set broadcast group for teachers": (l) => l.status === 200
    });
    const f = A(e, o).id;
    r = a.post(
      `${p}/communication/v2/group/${f}/communique/${i}`,
      "{}",
      { headers: s }
    ), d(r, {
      "open comm rule for broadcast group for teachers": (l) => l.status === 200
    }), r = a.get(`${p}/communication/group/${i}`, { headers: s }), c = JSON.parse(r.body);
  }
  return c;
}
function A(t, e) {
  return v(t.id, e).filter(
    (s) => s.name === `Teachers from group ${t.name}.` || s.name === `Enseignants du groupe ${t.name}.`
  )[0];
}
const O = __ENV.ROOT_URL;
function S(t, e) {
  let o = a.get(`${O}/appregistry/roles`, {
    headers: u(e)
  });
  return JSON.parse(o.body).filter((r) => r.name === t)[0];
}
function P(t, e) {
  const o = `${t} - All - Stress Test`;
  let s = S(o, e);
  if (s)
    console.log(`Role ${o} already existed`);
  else {
    let r = a.get(
      `${O}/appregistry/applications/actions?actionType=WORKFLOW`,
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
    r = a.post(`${O}/appregistry/role`, JSON.stringify(f), {
      headers: i
    }), console.log(r), d(r, { "save role ok": (l) => l.status == 201 }), s = S(o, e);
  }
  return s;
}
function v(t, e) {
  let o = a.get(
    `${O}/appregistry/groups/roles?structureId=${t}`,
    { headers: u(e) }
  );
  return d(o, {
    "get structure roles should be ok": (s) => s.status == 200
  }), JSON.parse(o.body);
}
const C = __ENV.ROOT_URL;
function X(t, e) {
  let o = u(e);
  const s = new b();
  s.append("file", a.file(t, "file.txt")), o["Content-Type"] = "multipart/form-data; boundary=" + s.boundary;
  let r = a.post(`${C}/workspace/document`, s.body(), { headers: o });
  return d(r, {
    "upload doc ok": (c) => c.status === 201
  }), JSON.parse(r.body);
}
const x = __ENV.ROOT_URL;
function Y(t, e, o) {
  const s = u(o);
  s["content-type"] = "application/json";
  const r = JSON.stringify(e);
  return a.put(`${x}/workspace/share/resource/${t}`, r, {
    headers: s
  });
}
export {
  U as BASE_URL,
  _ as Session,
  m as SessionMode,
  N as activateUser,
  z as activateUsers,
  G as authenticateOAuth2,
  F as authenticateWeb,
  P as createAndSetRole,
  q as createBroadcastGroup,
  W as createStructure,
  V as getConnectedUserId,
  u as getHeaders,
  L as getMetricValue,
  H as getRandomUser,
  S as getRoleByName,
  v as getRolesOfStructure,
  k as getSchoolByName,
  M as getUsersOfSchool,
  D as linkRoleToUsers,
  K as searchUser,
  Y as shareFile,
  X as uploadFile
};
