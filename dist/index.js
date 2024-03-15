var _ = Object.defineProperty;
var T = (e, o, r) => o in e ? _(e, o, { enumerable: !0, configurable: !0, writable: !0, value: r }) : e[o] = r;
var m = (e, o, r) => (T(e, typeof o != "symbol" ? o + "" : o, r), r);
import a from "k6/http";
import { check as d, fail as k } from "k6";
import { FormData as C } from "https://jslib.k6.io/formdata/0.0.2/index.js";
const h = {
  COOKIE: 0,
  OAUTH2: 1
};
class S {
  constructor(o, r, t, s) {
    m(this, "expiresAt");
    m(this, "token");
    m(this, "mode");
    m(this, "cookies");
    this.token = o, this.mode = r, this.cookies = s, this.expiresAt = Date.now() + t * 1e3 - 3e3;
  }
  isExpired() {
    return this.expiresAt <= Date.now();
  }
  getCookie(o) {
    return this.cookies ? this.cookies.filter((r) => r.name === o).map((r) => r.value)[0] : null;
  }
}
const U = __ENV.BASE_URL, I = 30 * 60, f = __ENV.ROOT_URL, l = function(e) {
  let o;
  return e ? e.mode === h.COOKIE ? o = { "x-xsrf-token": e.getCookie("XSRF-TOKEN") || "" } : e.mode === h.OAUTH2 ? o = { Authorization: `Bearer ${e.token}` } : o = {} : o = {}, o;
}, V = function(e, o) {
  const r = a.get(`${f}/conversation/visible?search=${e}`, {
    headers: l(o)
  });
  return d(r, {
    "should get an OK response": (s) => s.status == 200
  }), r.json("users")[0].id;
}, K = function(e) {
  const o = a.get(`${f}/auth/oauth2/userinfo`, {
    headers: l(e)
  });
  return d(o, {
    "should get an OK response": (r) => r.status == 200,
    "should get a valid userId": (r) => !!r.json("userId")
  }), o.json("userId");
}, H = function(e, o) {
  let r = {
    email: e,
    password: o,
    callBack: "",
    detail: ""
  };
  const t = a.post(`${f}/auth/login`, r, {
    redirects: 0
  });
  d(t, {
    "should redirect connected user to login page": (c) => c.status === 302,
    "should have set an auth cookie": (c) => c.cookies.oneSessionId !== null && c.cookies.oneSessionId !== void 0
  }), a.cookieJar().set(f, "oneSessionId", t.cookies.oneSessionId[0].value);
  const n = Object.keys(t.cookies).map((c) => ({ name: c, value: t.cookies[c][0].value }));
  return new S(
    t.cookies.oneSessionId[0].value,
    h.COOKIE,
    I,
    n
  );
}, L = function(e) {
  return a.cookieJar().set(f, "oneSessionId", e.token), e;
}, M = function(e, o, r, t) {
  let s = {
    grant_type: "password",
    username: e,
    password: o,
    client_id: r,
    client_secret: t,
    scope: "timeline userbook blog lvs actualites pronote schoolbook support viescolaire zimbra conversation directory homeworks userinfo workspace portal cas sso presences incidents competences diary edt infra auth"
  }, n = a.post(`${f}/auth/oauth2/token`, s, {
    redirects: 0
  });
  d(n, {
    "should get an OK response for authentication": (i) => i.status == 200,
    "should have set an access token": (i) => !!i.json("access_token")
  });
  const c = n.json("access_token");
  return new S(
    c,
    h.OAUTH2,
    n.json("expires_in")
  );
};
function P(e, o) {
  const r = (o || []).map((t) => t.id);
  for (let t = 0; t < 1e3; t++) {
    const s = e[Math.floor(Math.random() * e.length)];
    if (r.indexOf(s.id) < 0)
      return s;
  }
  throw "cannot.find.random.user";
}
const z = function(e, o) {
  const r = a.get(`${U}/metrics`, {
    headers: l(o)
  });
  d(r, {
    "should get an OK response": (s) => s.status == 200
  });
  const t = r.body.split(`
`);
  for (let s of t)
    if (s.indexOf(`${e} `) === 0)
      return parseFloat(s.substring(e.length + 1).trim());
  return console.error("Metric", e, "not found"), null;
}, g = __ENV.ROOT_URL;
function y(e, o) {
  let r = a.get(`${g}/directory/structure/admin/list`, {
    headers: l(o)
  });
  return JSON.parse(r.body).filter(
    (t) => t.name === e
  )[0];
}
function q(e, o) {
  let r = a.get(`${g}/directory/structure/${e.id}/users`, {
    headers: l(o)
  });
  if (r.status !== 200)
    throw `Impossible to get users of ${e.id}`;
  return JSON.parse(r.body);
}
function X(e, o) {
  let r = a.get(`${g}/directory/structure/${e.id}/users`, {
    headers: l(o)
  });
  r.status != 200 && k(`Cannot fetch users of structure ${e.id} : ${r}`);
  const t = JSON.parse(r.body);
  for (let s = 0; s < t.length; s++) {
    const n = t[s];
    E(n);
  }
}
function E(e) {
  if (e.code) {
    const o = {};
    o.login = e.login, o.activationCode = e.code, o.password = "password", o.confirmPassword = "password", o.acceptCGU = "true";
    const r = a.post(`${g}/auth/activation`, o, {
      redirects: 0,
      headers: { Host: "localhost" }
    });
    r.status !== 302 && k(`Could not activate user ${e.login} : ${r}`);
  }
}
function Y(e, o, r, t) {
  const n = b(e.id, t).filter(
    (c) => r.indexOf(c.name) >= 0
  );
  for (let c of n)
    if (c.roles.indexOf(o.name) >= 0)
      console.log("Role already attributed to teachers");
    else {
      const i = l(t);
      i["content-type"] = "application/json";
      const u = { headers: i }, p = JSON.stringify({
        groupId: c.id,
        roleIds: (c.roles || []).concat([o.id])
      }), O = a.post(
        `${g}/appregistry/authorize/group?schoolId=${e.id}`,
        p,
        u
      );
      d(O, {
        "link role to structure": (R) => R.status == 200
      });
    }
}
function Q(e, o, r) {
  let t = y(e, r);
  if (t)
    console.log(`Structure ${e} already exists`);
  else {
    const s = l(r);
    s["content-type"] = "application/json";
    const n = JSON.stringify({
      hasApp: o,
      name: e
    });
    let c = a.post(`${g}/directory/school`, n, s);
    c.status !== 201 && (console.error(c.body), k(`Could not create structure ${e}`)), t = y(e, r);
  }
  return t;
}
function Z(e, o, r) {
  let t = y(e, r);
  if (t)
    console.log("School already exists");
  else {
    const s = new C();
    s.append("type", "CSV"), s.append("structureName", e);
    let n, c, i;
    "teachers" in o ? (n = o.teachers, c = o.students, i = o.responsables) : n = o, s.append("Teacher", a.file(n, "enseignants.csv")), c && s.append("Student", a.file(c, "eleves.csv")), i && s.append("Relative", a.file(i, "responsables.csv"));
    const u = l(r);
    u["Content-Type"] = "multipart/form-data; boundary=" + s.boundary;
    const p = { headers: u };
    a.post(
      `${g}/directory/wizard/import`,
      s.body(),
      p
    ).status != 200 && k(`Could not create structure ${e}`), t = y(e, r);
  }
  return t;
}
function ee(e, o, r) {
  let t;
  if ((o.parents || []).map((n) => n.id).indexOf(e.id) >= 0)
    console.log(
      `${o.name} is already a child of ${e.name}`
    ), t = !1;
  else {
    const n = l(r);
    n["content-type"] = "application/json", a.put(
      `${g}/directory/structure/${o.id}/parent/${e.id}`,
      "{}"
    ).status !== 200 && k(
      `Could not attach structure ${o.name} as a child of ${e.name}`
    ), t = !0;
  }
  return t;
}
function oe(e, o, r) {
  const t = new C();
  t.append("type", "CSV"), t.append("structureName", e.name), t.append("structureId", e.id), t.append("structureExternalId", e.externalId);
  let s, n, c;
  "teachers" in o ? (s = o.teachers, n = o.students, c = o.responsables) : s = o, t.append("Teacher", a.file(s, "enseignants.csv")), n && t.append("Student", a.file(n, "eleves.csv")), c && t.append("Relative", a.file(c, "responsables.csv"));
  const i = l(r);
  i["Content-Type"] = "multipart/form-data; boundary=" + t.boundary;
  const u = { headers: i };
  return a.post(
    `${g}/directory/wizard/import`,
    t.body(),
    u
  );
}
const w = __ENV.ROOT_URL;
function W(e, o) {
  let r = a.get(`${w}/appregistry/roles`, {
    headers: l(o)
  });
  return JSON.parse(r.body).filter((s) => s.name === e)[0];
}
function re(e, o) {
  const r = `${e} - All - Stress Test`;
  let t = W(r, o);
  if (t)
    console.log(`Role ${r} already existed`);
  else {
    let s = a.get(
      `${w}/appregistry/applications/actions?actionType=WORKFLOW`,
      { headers: l(o) }
    );
    d(s, { "get workflow actions": (p) => p.status == 200 });
    const c = JSON.parse(s.body).filter(
      (p) => p.name === e
    )[0].actions.map((p) => p[0]), i = l(o);
    i["content-type"] = "application/json";
    const u = {
      role: r,
      actions: c
    };
    s = a.post(`${w}/appregistry/role`, JSON.stringify(u), {
      headers: i
    }), console.log(s), d(s, { "save role ok": (p) => p.status == 201 }), t = W(r, o);
  }
  return t;
}
function b(e, o) {
  let r = a.get(
    `${w}/appregistry/groups/roles?structureId=${e}`,
    { headers: l(o) }
  );
  return d(r, {
    "get structure roles should be ok": (t) => t.status == 200
  }), JSON.parse(r.body);
}
const D = __ENV.ROOT_URL, te = [
  "org-entcore-workspace-controllers-WorkspaceController|getDocument",
  "org-entcore-workspace-controllers-WorkspaceController|copyDocuments",
  "org-entcore-workspace-controllers-WorkspaceController|getDocumentProperties",
  "org-entcore-workspace-controllers-WorkspaceController|getRevision",
  "org-entcore-workspace-controllers-WorkspaceController|copyFolder",
  "org-entcore-workspace-controllers-WorkspaceController|getPreview",
  "org-entcore-workspace-controllers-WorkspaceController|copyDocument",
  "org-entcore-workspace-controllers-WorkspaceController|getDocumentBase64",
  "org-entcore-workspace-controllers-WorkspaceController|listRevisions",
  "org-entcore-workspace-controllers-WorkspaceController|commentFolder",
  "org-entcore-workspace-controllers-WorkspaceController|commentDocument",
  "org-entcore-workspace-controllers-WorkspaceController|shareJson",
  "org-entcore-workspace-controllers-WorkspaceController|deleteFolder",
  "org-entcore-workspace-controllers-WorkspaceController|restoreFolder",
  "org-entcore-workspace-controllers-WorkspaceController|removeShare",
  "org-entcore-workspace-controllers-WorkspaceController|moveFolder",
  "org-entcore-workspace-controllers-WorkspaceController|moveTrash",
  "org-entcore-workspace-controllers-WorkspaceController|restoreTrash",
  "org-entcore-workspace-controllers-WorkspaceController|bulkDelete",
  "org-entcore-workspace-controllers-WorkspaceController|shareResource",
  "org-entcore-workspace-controllers-WorkspaceController|deleteRevision",
  "org-entcore-workspace-controllers-WorkspaceController|shareJsonSubmit",
  "org-entcore-workspace-controllers-WorkspaceController|moveDocument",
  "org-entcore-workspace-controllers-WorkspaceController|renameFolder",
  "org-entcore-workspace-controllers-WorkspaceController|moveTrashFolder",
  "org-entcore-workspace-controllers-WorkspaceController|deleteComment",
  "org-entcore-workspace-controllers-WorkspaceController|getParentInfos",
  "org-entcore-workspace-controllers-WorkspaceController|deleteDocument",
  "org-entcore-workspace-controllers-WorkspaceController|renameDocument",
  "org-entcore-workspace-controllers-WorkspaceController|moveDocuments",
  "org-entcore-workspace-controllers-WorkspaceController|updateDocument"
], se = [
  "org-entcore-workspace-controllers-WorkspaceController|getDocument",
  "org-entcore-workspace-controllers-WorkspaceController|copyDocuments",
  "org-entcore-workspace-controllers-WorkspaceController|getDocumentProperties",
  "org-entcore-workspace-controllers-WorkspaceController|getRevision",
  "org-entcore-workspace-controllers-WorkspaceController|copyFolder",
  "org-entcore-workspace-controllers-WorkspaceController|getPreview",
  "org-entcore-workspace-controllers-WorkspaceController|copyDocument",
  "org-entcore-workspace-controllers-WorkspaceController|getDocumentBase64",
  "org-entcore-workspace-controllers-WorkspaceController|listRevisions",
  "org-entcore-workspace-controllers-WorkspaceController|commentFolder",
  "org-entcore-workspace-controllers-WorkspaceController|commentDocument"
];
function ne(e, o) {
  let r = l(o);
  const t = new C();
  t.append("file", a.file(e, "file.txt")), r["Content-Type"] = "multipart/form-data; boundary=" + t.boundary;
  let s = a.post(`${D}/workspace/document`, t.body(), { headers: r });
  return d(s, {
    "upload doc ok": (n) => n.status === 201
  }), JSON.parse(s.body);
}
const A = __ENV.ROOT_URL;
function ce(e, o, r) {
  const t = l(r);
  t["content-type"] = "application/json";
  const s = JSON.stringify(o);
  return a.put(`${A}/workspace/share/resource/${e}`, s, {
    headers: t
  });
}
const x = __ENV.ROOT_URL;
function ae(e, o, r) {
  const t = a.post(
    `${x}/communication/v2/group/${e}/communique/${o}`,
    "{}",
    { headers: l(r) }
  );
  return t.status !== 200 && (console.error(
    `Error while adding communication between ${e} -> ${o}`
  ), console.error(t), k(`could not add communication between ${e} -> ${o}`)), t;
}
const $ = __ENV.ROOT_URL;
function le(e, o, r) {
  let t = v(e, o, r);
  if (t)
    console.log("Broadcast group already existed");
  else {
    console.log("Creating broadcast group");
    const s = l(r);
    s["content-type"] = "application/json";
    let n = JSON.stringify({
      name: e,
      structureId: o.id,
      subType: "BroadcastGroup"
    }), c = a.post(`${$}/directory/group`, n, { headers: s });
    d(c, {
      "create broadcast group": (p) => p.status === 201
    });
    const i = JSON.parse(c.body).id;
    n = JSON.stringify({
      name: e,
      autolinkTargetAllStructs: !0,
      autolinkTargetStructs: [],
      autolinkUsersFromGroups: ["Teacher"]
    }), c = a.put(`${$}/directory/group/${i}`, n, { headers: s }), d(c, {
      "set broadcast group for teachers": (p) => p.status === 200
    });
    const u = J(o, r).id;
    j(i, [u], r), t = v(e, o, r);
  }
  return t;
}
function j(e, o, r) {
  const t = l(r);
  t["content-type"] = "application/json";
  for (let s of o) {
    let n = a.post(
      `${$}/communication/v2/group/${s}/communique/${e}`,
      "{}",
      { headers: t }
    );
    n.status !== 200 && (console.error(n), k(`Cannot open comm rule from ${s} to ${e}`));
  }
}
function J(e, o) {
  return b(e.id, o).filter(
    (t) => t.name === `Teachers from group ${e.name}.` || t.name === `Enseignants du groupe ${e.name}.`
  )[0];
}
function v(e, o, r) {
  const t = l(r);
  t["content-type"] = "application/json";
  let s = a.get(
    `${$}/directory/group/admin/list?translate=false&structureId=${o.id}`,
    { headers: t }
  );
  return JSON.parse(s.body).filter(
    (n) => n.subType === "BroadcastGroup" && n.name === e
  )[0];
}
export {
  U as BASE_URL,
  S as Session,
  h as SessionMode,
  te as WS_MANAGER_SHARE,
  se as WS_READER_SHARE,
  E as activateUser,
  X as activateUsers,
  j as addCommRuleToGroup,
  ae as addCommunicationBetweenGroups,
  ee as attachStructureAsChild,
  M as authenticateOAuth2,
  H as authenticateWeb,
  re as createAndSetRole,
  le as createBroadcastGroup,
  Q as createEmptyStructure,
  Z as createStructure,
  v as getBroadcastGroup,
  K as getConnectedUserId,
  l as getHeaders,
  z as getMetricValue,
  P as getRandomUser,
  W as getRoleByName,
  b as getRolesOfStructure,
  y as getSchoolByName,
  J as getTeacherRole,
  q as getUsersOfSchool,
  oe as importUsers,
  Y as linkRoleToUsers,
  V as searchUser,
  ce as shareFile,
  L as switchSession,
  ne as uploadFile
};
