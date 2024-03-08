import http from "k6/http";
import { getHeaders } from "./user.utils";
import { Role, Session, getRolesOfStructure } from ".";
import { check, bytes, fail } from "k6";
//@ts-ignore
import { FormData } from "https://jslib.k6.io/formdata/0.0.2/index.js";

const rootUrl = __ENV.ROOT_URL;

export type Structure = {
  id: string;
  name: string;
  externalId: string;
  feederName: string;
  source: string;
};

export type StructureInitData = {
  teachers: bytes;
  students: bytes;
  responsables: bytes;
};

export type BroadcastGroup = {
  id: string;
  name: string;
  displayName: string;
  labels: string[];
  autolinkTargetAllStructs: boolean;
  autolinkTargetStructs: string[];
  autolinkUsersFromGroups: string[];
  type: string;
  structures: Structure[];
};

export function getSchoolByName(name: string, session: Session): Structure {
  let ecoles = http.get(`${rootUrl}/directory/structure/admin/list`, {
    headers: getHeaders(session),
  });
  return JSON.parse(<string>ecoles.body).filter(
    (structure: Structure) => structure.name === name,
  )[0];
}

export function getUsersOfSchool(school: Structure, session: Session) {
  let res = http.get(`${rootUrl}/directory/structure/${school.id}/users`, {
    headers: getHeaders(session),
  });
  if (res.status !== 200) {
    throw `Impossible to get users of ${school.id}`;
  }
  return JSON.parse(<string>res.body);
}

export function activateUsers(structure: Structure, session: Session) {
  let res = http.get(`${rootUrl}/directory/structure/${structure.id}/users`, {
    headers: getHeaders(session),
  });
  if (res.status != 200) {
    fail(`Cannot fetch users of structure ${structure.id} : ${res}`);
  }
  const users = JSON.parse(<string>res.body);
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    activateUser(user);
  }
}

export function activateUser(user: any) {
  if (user.code) {
    const fd: any = {};
    fd["login"] = user.login;
    fd["activationCode"] = user.code;
    fd["password"] = "password";
    fd["confirmPassword"] = "password";
    fd["acceptCGU"] = "true";
    const res = http.post(`${rootUrl}/auth/activation`, fd, {
      redirects: 0,
      headers: { Host: "localhost" },
    });
    if (res.status !== 302) {
      fail(`Could not activate user ${user.login} : ${res}`);
    }
  }
}

export function linkRoleToUsers(
  structure: Structure,
  role: Role,
  groupNames: string[],
  session: Session,
) {
  const roles = getRolesOfStructure(structure.id, session);
  const teacherRoless = roles.filter(
    (role) => groupNames.indexOf(role.name) >= 0,
  );
  for (let teacherRoles of teacherRoless) {
    if (teacherRoles.roles.indexOf(role.name) >= 0) {
      console.log("Role already attributed to teachers");
    } else {
      const headers = getHeaders(session);
      headers["content-type"] = "application/json";
      const params = { headers };
      const payload = JSON.stringify({
        groupId: teacherRoles.id,
        roleIds: (teacherRoles.roles || []).concat([role.id]),
      });
      const res = http.post(
        `${rootUrl}/appregistry/authorize/group?schoolId=${structure.id}`,
        payload,
        params,
      );
      check(res, {
        "link role to structure": (r) => r.status == 200,
      });
    }
  }
}

export function createStructure(
  schoolName: string,
  users: bytes | StructureInitData,
  session: Session,
) {
  let ecoleAudience = getSchoolByName(schoolName, session);
  if (ecoleAudience) {
    console.log("School already exists");
  } else {
    const fd = new FormData();
    fd.append("type", "CSV");
    fd.append("structureName", schoolName);
    //@ts-ignore
    let teachers: bytes;
    let students: bytes | undefined;
    let responsables: bytes | undefined;
    if ("teachers" in users) {
      teachers = (<StructureInitData>users).teachers;
      students = (<StructureInitData>users).students;
      responsables = (<StructureInitData>users).responsables;
    } else {
      teachers = <bytes>users;
    }
    fd.append("Teacher", http.file(teachers, "enseignants.csv"));
    if (students) {
      fd.append("Student", http.file(students, "eleves.csv"));
    }
    if (responsables) {
      fd.append("Relative", http.file(responsables, "responsables.csv"));
    }
    const headers = getHeaders(session);
    //@ts-ignore
    headers["Content-Type"] = "multipart/form-data; boundary=" + fd.boundary;
    const params = { headers };
    //@ts-ignore
    const res = http.post(
      `${rootUrl}/directory/wizard/import`,
      fd.body(),
      params,
    );
    if (res.status != 200) {
      fail(`Could not create structure ${schoolName}`);
    }
    ecoleAudience = getSchoolByName(schoolName, session);
  }
  return ecoleAudience;
}

export function importUsers(
  structure: Structure,
  users: bytes | StructureInitData,
  session: Session,
) {
  const fd = new FormData();
  fd.append("type", "CSV");
  fd.append("structureName", structure.name);
  fd.append("structureId", structure.id);
  fd.append("structureExternalId", structure.externalId);
  //@ts-ignore
  let teachers: bytes;
  let students: bytes | undefined;
  let responsables: bytes | undefined;
  if ("teachers" in users) {
    teachers = (<StructureInitData>users).teachers;
    students = (<StructureInitData>users).students;
    responsables = (<StructureInitData>users).responsables;
  } else {
    teachers = <bytes>users;
  }
  fd.append("Teacher", http.file(teachers, "enseignants.csv"));
  if (students) {
    fd.append("Student", http.file(students, "eleves.csv"));
  }
  if (responsables) {
    fd.append("Relative", http.file(responsables, "responsables.csv"));
  }
  const headers = getHeaders(session);
  //@ts-ignore
  headers["Content-Type"] = "multipart/form-data; boundary=" + fd.boundary;
  const params = { headers };
  //@ts-ignore
  const res = http.post(
    `${rootUrl}/directory/wizard/import`,
    fd.body(),
    params,
  );
  return res;
}

export function getBroadcastGroup(
  broadcastListName: string,
  school: Structure,
  session: Session,
): BroadcastGroup {
  const headers = getHeaders(session);
  headers["content-type"] = "application/json";
  let res = http.get(
    `${rootUrl}/directory/group/admin/list?translate=false&structureId=${school.id}`,
    { headers },
  );
  return JSON.parse(<string>res.body).filter(
    (e: any) => e.subType === "BroadcastGroup" && e.name === broadcastListName,
  )[0];
}

export function createBroadcastGroup(
  broadcastListName: string,
  school: Structure,
  session: Session,
): BroadcastGroup {
  let broadcastGroup = getBroadcastGroup(broadcastListName, school, session);
  if (broadcastGroup) {
    console.log("Broadcast group already existed");
  } else {
    console.log("Creating broadcast group");
    const headers = getHeaders(session);
    headers["content-type"] = "application/json";
    let payload = JSON.stringify({
      name: broadcastListName,
      structureId: school.id,
      subType: "BroadcastGroup",
    });
    let res = http.post(`${rootUrl}/directory/group`, payload, { headers });
    check(res, {
      "create broadcast group": (r) => r.status === 201,
    });
    const blId = JSON.parse(<string>res.body).id;
    payload = JSON.stringify({
      name: broadcastListName,
      autolinkTargetAllStructs: true,
      autolinkTargetStructs: [],
      autolinkUsersFromGroups: ["Teacher"],
    });
    res = http.put(`${rootUrl}/directory/group/${blId}`, payload, { headers });
    check(res, {
      "set broadcast group for teachers": (r) => r.status === 200,
    });
    const teacherGroupId = getTeacherRole(school, session).id;
    res = http.post(
      `${rootUrl}/communication/v2/group/${teacherGroupId}/communique/${blId}`,
      "{}",
      { headers },
    );
    check(res, {
      "open comm rule for broadcast group for teachers": (r) =>
        r.status === 200,
    });
    broadcastGroup = getBroadcastGroup(broadcastListName, school, session);
  }
  return broadcastGroup;
}

function getTeacherRole(structure: Structure, session: Session) {
  const roles = getRolesOfStructure(structure.id, session);
  return roles.filter(
    (role) =>
      role.name === `Teachers from group ${structure.name}.` ||
      role.name === `Enseignants du groupe ${structure.name}.`,
  )[0];
}
