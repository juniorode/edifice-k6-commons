var T = Object.defineProperty;
var U = (o, e, r) => e in o ? T(o, e, { enumerable: !0, configurable: !0, writable: !0, value: r }) : o[e] = r;
var m = (o, e, r) => (U(o, typeof e != "symbol" ? e + "" : e, r), r);
import c from "k6/http";
import { check as u, fail as f } from "k6";
import { FormData as C } from "https://jslib.k6.io/formdata/0.0.2/index.js";
const h = {
  COOKIE: 0,
  OAUTH2: 1
};
class b {
  constructor(e, r, t, s) {
    m(this, "expiresAt");
    m(this, "token");
    m(this, "mode");
    m(this, "cookies");
    this.token = e, this.mode = r, this.cookies = s, this.expiresAt = Date.now() + t * 1e3 - 3e3;
  }
  isExpired() {
    return this.expiresAt <= Date.now();
  }
  getCookie(e) {
    return this.cookies ? this.cookies.filter((r) => r.name === e).map((r) => r.value)[0] : null;
  }
}
const I = __ENV.BASE_URL, E = 30 * 60, k = __ENV.ROOT_URL, l = function(o) {
  let e;
  return o ? o.mode === h.COOKIE ? e = { "x-xsrf-token": o.getCookie("XSRF-TOKEN") || "" } : o.mode === h.OAUTH2 ? e = { Authorization: `Bearer ${o.token}` } : e = {} : e = {}, e;
}, V = function(o, e) {
  const r = c.get(`${k}/conversation/visible?search=${o}`, {
    headers: l(e)
  });
  return u(r, {
    "should get an OK response": (s) => s.status == 200
  }), r.json("users")[0].id;
}, K = function(o) {
  const e = c.get(`${k}/auth/oauth2/userinfo`, {
    headers: l(o)
  });
  return u(e, {
    "should get an OK response": (r) => r.status == 200,
    "should get a valid userId": (r) => !!r.json("userId")
  }), e.json("userId");
}, H = function(o, e) {
  let r = {
    email: o,
    password: e,
    callBack: "",
    detail: ""
  };
  const t = c.post(`${k}/auth/login`, r, {
    redirects: 0
  });
  u(t, {
    "should redirect connected user to login page": (a) => a.status === 302,
    "should have set an auth cookie": (a) => a.cookies.oneSessionId !== null && a.cookies.oneSessionId !== void 0
  }), c.cookieJar().set(k, "oneSessionId", t.cookies.oneSessionId[0].value);
  const n = Object.keys(t.cookies).map((a) => ({ name: a, value: t.cookies[a][0].value }));
  return new b(
    t.cookies.oneSessionId[0].value,
    h.COOKIE,
    E,
    n
  );
}, P = function(o) {
  return c.cookieJar().set(k, "oneSessionId", o.token), o;
}, M = function(o, e, r, t) {
  let s = {
    grant_type: "password",
    username: o,
    password: e,
    client_id: r,
    client_secret: t,
    scope: "timeline userbook blog lvs actualites pronote schoolbook support viescolaire zimbra conversation directory homeworks userinfo workspace portal cas sso presences incidents competences diary edt infra auth"
  }, n = c.post(`${k}/auth/oauth2/token`, s, {
    redirects: 0
  });
  u(n, {
    "should get an OK response for authentication": (i) => i.status == 200,
    "should have set an access token": (i) => !!i.json("access_token")
  });
  const a = n.json("access_token");
  return new b(
    a,
    h.OAUTH2,
    n.json("expires_in")
  );
};
function z(o, e) {
  const r = (e || []).map((t) => t.id);
  for (let t = 0; t < 1e3; t++) {
    const s = o[Math.floor(Math.random() * o.length)];
    if (r.indexOf(s.id) < 0)
      return s;
  }
  throw "cannot.find.random.user";
}
const q = function(o, e) {
  const r = c.get(`${I}/metrics`, {
    headers: l(e)
  });
  u(r, {
    "should get an OK response": (s) => s.status == 200
  });
  const t = r.body.split(`
`);
  for (let s of t)
    if (s.indexOf(`${o} `) === 0)
      return parseFloat(s.substring(o.length + 1).trim());
  return console.error("Metric", o, "not found"), null;
}, g = __ENV.ROOT_URL;
function y(o, e) {
  let r = c.get(`${g}/directory/structure/admin/list`, {
    headers: l(e)
  });
  return JSON.parse(r.body).filter(
    (t) => t.name === o
  )[0];
}
function X(o, e) {
  let r = c.get(`${g}/directory/structure/${o.id}/users`, {
    headers: l(e)
  });
  if (r.status !== 200)
    throw `Impossible to get users of ${o.id}`;
  return JSON.parse(r.body);
}
function Y(o, e) {
  let r = c.get(`${g}/directory/structure/${o.id}/users`, {
    headers: l(e)
  });
  r.status != 200 && f(`Cannot fetch users of structure ${o.id} : ${r}`);
  const t = JSON.parse(r.body);
  for (let s = 0; s < t.length; s++) {
    const n = t[s];
    D(n);
  }
}
function D(o) {
  if (o.code) {
    const e = {};
    e.login = o.login, e.activationCode = o.code, e.password = "password", e.confirmPassword = "password", e.acceptCGU = "true";
    const r = c.post(`${g}/auth/activation`, e, {
      redirects: 0,
      headers: { Host: "localhost" }
    });
    r.status !== 302 && f(`Could not activate user ${o.login} : ${r}`);
  }
}
function Q(o, e, r, t) {
  const n = R(o.id, t).filter(
    (a) => r.indexOf(a.name) >= 0
  );
  for (let a of n)
    if (a.roles.indexOf(e.name) >= 0)
      console.log("Role already attributed to teachers");
    else {
      const i = l(t);
      i["content-type"] = "application/json";
      const d = { headers: i }, p = JSON.stringify({
        groupId: a.id,
        roleIds: (a.roles || []).concat([e.id])
      }), S = c.post(
        `${g}/appregistry/authorize/group?schoolId=${o.id}`,
        p,
        d
      );
      u(S, {
        "link role to structure": (_) => _.status == 200
      });
    }
}
function Z(o, e, r) {
  let t = y(o, r);
  if (t)
    console.log(`Structure ${o} already exists`);
  else {
    const s = l(r);
    s["content-type"] = "application/json";
    const n = JSON.stringify({
      hasApp: e,
      name: o
    });
    let a = c.post(`${g}/directory/school`, n, s);
    a.status !== 201 && (console.error(a.body), f(`Could not create structure ${o}`)), t = y(o, r);
  }
  return t;
}
function ee(o, e, r) {
  let t = y(o, r);
  if (t)
    console.log("School already exists");
  else {
    const s = new C();
    s.append("type", "CSV"), s.append("structureName", o);
    let n, a, i;
    "teachers" in e ? (n = e.teachers, a = e.students, i = e.responsables) : n = e, s.append("Teacher", c.file(n, "enseignants.csv")), a && s.append("Student", c.file(a, "eleves.csv")), i && s.append("Relative", c.file(i, "responsables.csv"));
    const d = l(r);
    d["Content-Type"] = "multipart/form-data; boundary=" + s.boundary;
    const p = { headers: d };
    c.post(
      `${g}/directory/wizard/import`,
      s.body(),
      p
    ).status != 200 && f(`Could not create structure ${o}`), t = y(o, r);
  }
  return t;
}
function oe(o, e, r) {
  let t;
  if ((e.parents || []).map((n) => n.id).indexOf(o.id) >= 0)
    console.log(
      `${e.name} is already a child of ${o.name}`
    ), t = !1;
  else {
    const n = l(r);
    n["content-type"] = "application/json", c.put(
      `${g}/directory/structure/${e.id}/parent/${o.id}`,
      "{}"
    ).status !== 200 && f(
      `Could not attach structure ${e.name} as a child of ${o.name}`
    ), t = !0;
  }
  return t;
}
function re(o, e, r) {
  const t = new C();
  t.append("type", "CSV"), t.append("structureName", o.name), t.append("structureId", o.id), t.append("structureExternalId", o.externalId);
  let s, n, a;
  "teachers" in e ? (s = e.teachers, n = e.students, a = e.responsables) : s = e, t.append("Teacher", c.file(s, "enseignants.csv")), n && t.append("Student", c.file(n, "eleves.csv")), a && t.append("Relative", c.file(a, "responsables.csv"));
  const i = l(r);
  i["Content-Type"] = "multipart/form-data; boundary=" + t.boundary;
  const d = { headers: i };
  return c.post(
    `${g}/directory/wizard/import`,
    t.body(),
    d
  );
}
function te(o) {
  const e = l(o);
  return e["content-type"] = "application/json", c.post(`${g}/directory/import`, "{}", { headers: e });
}
const w = __ENV.ROOT_URL;
function v(o, e) {
  let r = c.get(`${w}/appregistry/roles`, {
    headers: l(e)
  });
  return JSON.parse(r.body).filter((s) => s.name === o)[0];
}
function se(o, e) {
  const r = `${o} - All - Stress Test`;
  let t = v(r, e);
  if (t)
    console.log(`Role ${r} already existed`);
  else {
    let s = c.get(
      `${w}/appregistry/applications/actions?actionType=WORKFLOW`,
      { headers: l(e) }
    );
    u(s, { "get workflow actions": (p) => p.status == 200 });
    const a = JSON.parse(s.body).filter(
      (p) => p.name === o
    )[0].actions.map((p) => p[0]), i = l(e);
    i["content-type"] = "application/json";
    const d = {
      role: r,
      actions: a
    };
    s = c.post(`${w}/appregistry/role`, JSON.stringify(d), {
      headers: i
    }), console.log(s), u(s, { "save role ok": (p) => p.status == 201 }), t = v(r, e);
  }
  return t;
}
function R(o, e) {
  const r = l(e);
  r["Accept-Language"] = "en";
  let t = c.get(
    `${w}/appregistry/groups/roles?structureId=${o}&translate=false`,
    { headers: r }
  );
  return u(t, {
    "get structure roles should be ok": (s) => s.status == 200
  }), JSON.parse(t.body);
}
const A = __ENV.ROOT_URL, ne = [
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
], ce = [
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
function ae(o, e) {
  let r = l(e);
  const t = new C();
  t.append("file", c.file(o, "file.txt")), r["Content-Type"] = "multipart/form-data; boundary=" + t.boundary;
  let s = c.post(`${A}/workspace/document`, t.body(), { headers: r });
  return u(s, {
    "upload doc ok": (n) => n.status === 201
  }), JSON.parse(s.body);
}
const j = __ENV.ROOT_URL;
function le(o, e, r) {
  const t = l(r);
  t["content-type"] = "application/json";
  const s = JSON.stringify(e);
  return c.put(`${j}/workspace/share/resource/${o}`, s, {
    headers: t
  });
}
const x = __ENV.ROOT_URL;
function ie(o, e, r) {
  const t = c.post(
    `${x}/communication/v2/group/${o}/communique/${e}`,
    "{}",
    { headers: l(r) }
  );
  return t.status !== 200 && (console.error(
    `Error while adding communication between ${o} -> ${e}`
  ), console.error(t), f(`could not add communication between ${o} -> ${e}`)), t;
}
const $ = __ENV.ROOT_URL;
function pe(o, e, r) {
  let t = W(o, e, r);
  if (t)
    console.log("Broadcast group already existed");
  else {
    console.log("Creating broadcast group");
    const s = l(r);
    s["content-type"] = "application/json";
    let n = JSON.stringify({
      name: o,
      structureId: e.id,
      subType: "BroadcastGroup"
    }), a = c.post(`${$}/directory/group`, n, { headers: s });
    u(a, {
      "create broadcast group": (p) => p.status === 201
    });
    const i = JSON.parse(a.body).id;
    n = JSON.stringify({
      name: o,
      autolinkTargetAllStructs: !0,
      autolinkTargetStructs: [],
      autolinkUsersFromGroups: ["Teacher"]
    }), a = c.put(`${$}/directory/group/${i}`, n, { headers: s }), u(a, {
      "set broadcast group for teachers": (p) => p.status === 200
    });
    const d = N(e, r).id;
    J(i, [d], r), t = W(o, e, r);
  }
  return t;
}
function J(o, e, r) {
  const t = l(r);
  t["content-type"] = "application/json";
  for (let s of e) {
    let n = c.post(
      `${$}/communication/v2/group/${s}/communique/${o}`,
      "{}",
      { headers: t }
    );
    n.status !== 200 && (console.error(n), f(`Cannot open comm rule from ${s} to ${o}`));
  }
}
function N(o, e) {
  return O("teachers", o, e);
}
function ue(o, e) {
  return O("students", o, e);
}
function de(o, e) {
  return O("relatives", o, e);
}
function O(o, e, r) {
  return R(e.id, r).filter((s) => {
    const n = s.name.toLowerCase();
    return n === `${e.name} group ${o}.`.toLowerCase() || n === `${o} from group ${e.name}.`.toLowerCase();
  })[0];
}
function W(o, e, r) {
  const t = l(r);
  t["content-type"] = "application/json";
  let s = c.get(
    `${$}/directory/group/admin/list?translate=false&structureId=${e.id}`,
    { headers: t }
  );
  return JSON.parse(s.body).filter(
    (n) => n.subType === "BroadcastGroup" && n.name === o
  )[0];
}
export {
  I as BASE_URL,
  b as Session,
  h as SessionMode,
  ne as WS_MANAGER_SHARE,
  ce as WS_READER_SHARE,
  D as activateUser,
  Y as activateUsers,
  J as addCommRuleToGroup,
  ie as addCommunicationBetweenGroups,
  oe as attachStructureAsChild,
  M as authenticateOAuth2,
  H as authenticateWeb,
  se as createAndSetRole,
  pe as createBroadcastGroup,
  Z as createEmptyStructure,
  ee as createStructure,
  W as getBroadcastGroup,
  K as getConnectedUserId,
  l as getHeaders,
  q as getMetricValue,
  de as getParentRole,
  O as getProfileGroupOfStructure,
  z as getRandomUser,
  v as getRoleByName,
  R as getRolesOfStructure,
  y as getSchoolByName,
  ue as getStudentRole,
  N as getTeacherRole,
  X as getUsersOfSchool,
  re as importUsers,
  Q as linkRoleToUsers,
  V as searchUser,
  le as shareFile,
  P as switchSession,
  te as triggerImport,
  ae as uploadFile
};
