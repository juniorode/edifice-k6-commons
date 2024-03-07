var v = Object.defineProperty;
var R = (o, e, t) => e in o ? v(o, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : o[e] = t;
var g = (o, e, t) => (R(o, typeof e != "symbol" ? e + "" : e, t), t);
import a from "k6/http";
import { check as u } from "k6";
import { FormData as b } from "https://jslib.k6.io/formdata/0.0.2/index.js";
const y = {
  COOKIE: 0,
  OAUTH2: 1
};
class _ {
  constructor(e, t, r, s) {
    g(this, "expiresAt");
    g(this, "token");
    g(this, "mode");
    g(this, "cookies");
    this.token = e, this.mode = t, this.cookies = s, this.expiresAt = Date.now() + r * 1e3 - 3e3;
  }
  isExpired() {
    return this.expiresAt <= Date.now();
  }
  getCookie(e) {
    return this.cookies ? this.cookies.filter((t) => t.name === e).map((t) => t.value)[0] : null;
  }
}
const I = __ENV.BASE_URL, U = 30 * 60, h = __ENV.ROOT_URL, d = function(o) {
  let e;
  return o ? o.mode === y.COOKIE ? e = { "x-xsrf-token": o.getCookie("XSRF-TOKEN") || "" } : o.mode === y.OAUTH2 ? e = { Authorization: `Bearer ${o.token}` } : e = {} : e = {}, e;
}, C = function(o, e) {
  const t = a.get(`${h}/conversation/visible?search=${o}`, {
    headers: d(e)
  });
  return u(t, {
    "should get an OK response": (s) => s.status == 200
  }), t.json("users")[0].id;
}, B = function(o) {
  const e = a.get(`${h}/auth/oauth2/userinfo`, {
    headers: d(o)
  });
  return u(e, {
    "should get an OK response": (t) => t.status == 200,
    "should get a valid userId": (t) => !!t.json("userId")
  }), e.json("userId");
}, K = function(o, e) {
  let t = {
    email: o,
    password: e,
    callBack: "",
    detail: ""
  };
  const r = a.post(`${h}/auth/login`, t, {
    redirects: 0
  });
  u(r, {
    "should redirect connected user to login page": (n) => n.status === 302,
    "should have set an auth cookie": (n) => n.cookies.oneSessionId !== null && n.cookies.oneSessionId !== void 0
  }), a.cookieJar().set(h, "oneSessionId", r.cookies.oneSessionId[0].value);
  const c = Object.keys(r.cookies).map((n) => ({ name: n, value: r.cookies[n][0].value }));
  return new _(
    r.cookies.oneSessionId[0].value,
    y.COOKIE,
    U,
    c
  );
}, V = function(o, e, t, r) {
  let s = {
    grant_type: "password",
    username: o,
    password: e,
    client_id: t,
    client_secret: r,
    scope: "timeline userbook blog lvs actualites pronote schoolbook support viescolaire zimbra conversation directory homeworks userinfo workspace portal cas sso presences incidents competences diary edt infra auth"
  }, c = a.post(`${h}/auth/oauth2/token`, s, {
    redirects: 0
  });
  u(c, {
    "should get an OK response for authentication": (i) => i.status == 200,
    "should have set an access token": (i) => !!i.json("access_token")
  });
  const n = c.json("access_token");
  return new _(
    n,
    y.OAUTH2,
    c.json("expires_in")
  );
}, F = function(o, e) {
  const t = a.get(`${I}/metrics`, {
    headers: d(e)
  });
  u(t, {
    "should get an OK response": (s) => s.status == 200
  });
  const r = t.body.split(`
`);
  for (let s of r)
    if (s.indexOf(`${o} `) === 0)
      return parseFloat(s.substring(o.length + 1).trim());
  return console.error("Metric", o, "not found"), null;
}, p = __ENV.ROOT_URL;
function k(o, e) {
  let t = a.get(`${p}/directory/api/ecole`, {
    headers: d(e)
  });
  const r = JSON.parse(t.body).result;
  return Object.keys(r || {}).map((c) => r[c]).filter((c) => c.name === o)[0];
}
function G(o, e) {
  let t = a.get(`${p}/directory/structure/${o.id}/users`, {
    headers: d(e)
  });
  if (t.status !== 200)
    throw `Impossible to get users of ${o.id}`;
  return JSON.parse(t.body);
}
function H(o, e) {
  let t = a.get(`${p}/directory/structure/${o.id}/users`, {
    headers: d(e)
  });
  u(t, {
    "fetch structure users": (s) => s.status == 200
  });
  const r = JSON.parse(t.body);
  for (let s = 0; s < r.length; s++) {
    const c = r[s];
    if (c.code) {
      const n = {};
      n.login = c.login, n.activationCode = c.code, n.password = "password", n.confirmPassword = "password", n.acceptCGU = "true", t = a.post(`${p}/auth/activation`, n, {
        redirects: 0,
        headers: { Host: "localhost" }
      }), u(t, {
        "activate user": (i) => i.status === 302
      });
    }
  }
}
function L(o, e, t, r) {
  const c = T(o.id, r).filter(
    (n) => t.indexOf(n.name) >= 0
  );
  for (let n of c)
    if (n.roles.indexOf(e.name) >= 0)
      console.log("Role already attributed to teachers");
    else {
      const i = d(r);
      i["content-type"] = "application/json";
      const f = { headers: i }, l = JSON.stringify({
        groupId: n.id,
        roleIds: (n.roles || []).concat([e.id])
      }), O = a.post(
        `${p}/appregistry/authorize/group?schoolId=${o.id}`,
        l,
        f
      );
      u(O, {
        "link role to structure": ($) => $.status == 200
      });
    }
}
function z(o, e, t) {
  let r = k(o, t);
  if (r)
    console.log("School already exists");
  else {
    const s = new b();
    s.append("type", "CSV"), s.append("structureName", o);
    let c, n, i;
    "teachers" in e ? (c = e.teachers, n = e.students, i = e.responsables) : c = e, s.append("Teacher", a.file(c, "enseignants.csv")), n && s.append("Student", a.file(n, "eleves.csv")), i && s.append("Relative", a.file(i, "responsables.csv"));
    const f = d(t);
    f["Content-Type"] = "multipart/form-data; boundary=" + s.boundary;
    const l = { headers: f }, O = a.post(
      `${p}/directory/wizard/import`,
      s.body(),
      l
    );
    u(O, {
      "import structure is ok": ($) => $.status == 200
    }), r = k(o, t);
  }
  return r;
}
function D(o, e, t) {
  const r = d(t);
  r["content-type"] = "application/json";
  let s = a.get(
    `${p}/directory/group/admin/list?translate=false&structureId=${e.id}`,
    { headers: r }
  ), c = JSON.parse(s.body).filter(
    (n) => n.subType === "BroadcastGroup" && n.name === o
  )[0];
  if (c)
    console.log("Broadcast group already existed");
  else {
    console.log("Creating broadcast group");
    let n = JSON.stringify({
      name: o,
      structureId: e.id,
      subType: "BroadcastGroup"
    });
    s = a.post(`${p}/directory/group`, n, { headers: r }), u(s, {
      "create broadcast group": (l) => l.status === 201
    });
    const i = JSON.parse(s.body).id;
    n = JSON.stringify({
      name: o,
      autolinkTargetAllStructs: !0,
      autolinkTargetStructs: [],
      autolinkUsersFromGroups: ["Teacher"]
    }), s = a.put(`${p}/directory/group/${i}`, n, { headers: r }), u(s, {
      "set broadcast group for teachers": (l) => l.status === 200
    });
    const f = w(e, t).id;
    s = a.post(
      `${p}/communication/v2/group/${f}/communique/${i}`,
      "{}",
      { headers: r }
    ), u(s, {
      "open comm rule for broadcast group for teachers": (l) => l.status === 200
    }), s = a.get(`${p}/communication/group/${i}`, { headers: r }), c = JSON.parse(s.body);
  }
  return c;
}
function w(o, e) {
  return T(o.id, e).filter(
    (r) => r.name === `Teachers from group ${o.name}.` || r.name === `Enseignants du groupe ${o.name}.`
  )[0];
}
const m = __ENV.ROOT_URL;
function S(o, e) {
  let t = a.get(`${m}/appregistry/roles`, {
    headers: d(e)
  });
  return JSON.parse(t.body).filter((s) => s.name === o)[0];
}
function M(o, e) {
  const t = `${o} - All - Stress Test`;
  let r = S(t, e);
  if (r)
    console.log(`Role ${t} already existed`);
  else {
    let s = a.get(
      `${m}/appregistry/applications/actions?actionType=WORKFLOW`,
      { headers: d(e) }
    );
    u(s, { "get workflow actions": (l) => l.status == 200 });
    const n = JSON.parse(s.body).filter(
      (l) => l.name === o
    )[0].actions.map((l) => l[0]), i = d(e);
    i["content-type"] = "application/json";
    const f = {
      role: t,
      actions: n
    };
    s = a.post(`${m}/appregistry/role`, JSON.stringify(f), {
      headers: i
    }), console.log(s), u(s, { "save role ok": (l) => l.status == 201 }), r = S(t, e);
  }
  return r;
}
function T(o, e) {
  let t = a.get(
    `${m}/appregistry/groups/roles?structureId=${o}`,
    { headers: d(e) }
  );
  return u(t, {
    "get structure roles should be ok": (r) => r.status == 200
  }), JSON.parse(t.body);
}
const N = __ENV.ROOT_URL;
function W(o, e) {
  let t = d(e);
  const r = new b();
  r.append("file", a.file(o, "file.txt")), t["Content-Type"] = "multipart/form-data; boundary=" + r.boundary;
  let s = a.post(`${N}/workspace/document`, r.body(), { headers: t });
  return u(s, {
    "upload doc ok": (c) => c.status === 201
  }), JSON.parse(s.body);
}
const A = __ENV.ROOT_URL;
function q(o, e, t) {
  const r = d(t);
  r["content-type"] = "application/json";
  const s = JSON.stringify(e);
  return a.put(`${A}/workspace/share/resource/${o}`, s, {
    headers: r
  });
}
export {
  I as BASE_URL,
  _ as Session,
  y as SessionMode,
  H as activateUsers,
  V as authenticateOAuth2,
  K as authenticateWeb,
  M as createAndSetRole,
  D as createBroadcastGroup,
  z as createStructure,
  B as getConnectedUserId,
  d as getHeaders,
  F as getMetricValue,
  S as getRoleByName,
  T as getRolesOfStructure,
  k as getSchoolByName,
  G as getUsersOfSchool,
  L as linkRoleToUsers,
  C as searchUser,
  q as shareFile,
  W as uploadFile
};
