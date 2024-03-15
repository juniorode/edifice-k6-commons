import http from "k6/http";
import { getHeaders } from "./user.utils";
import { Role, Session, getRolesOfStructure } from ".";
import { check, bytes, fail } from "k6";
//@ts-ignore
import { FormData } from "https://jslib.k6.io/formdata/0.0.2/index.js";
import { Structure, StructureInitData } from "./models";

const rootUrl = __ENV.ROOT_URL;

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
export function createEmptyStructure(
  structureName: string,
  hasApp: boolean,
  session: Session,
): Structure {
  let structure = getSchoolByName(structureName, session);
  if (structure) {
    console.log(`Structure ${structureName} already exists`);
  } else {
    const headers = getHeaders(session);
    headers["content-type"] = "application/json";
    const payload = JSON.stringify({
      hasApp,
      name: structureName,
    });
    let res = http.post(`${rootUrl}/directory/school`, payload, headers);
    if (res.status !== 201) {
      console.error(res.body);
      fail(`Could not create structure ${structureName}`);
    }
    structure = getSchoolByName(structureName, session);
  }
  return structure;
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

export function attachStructureAsChild(
  parentStructure: Structure,
  childStructure: Structure,
  session: Session,
): boolean {
  let added: boolean;
  const parentIds = (childStructure.parents || []).map((p) => p.id);
  if (parentIds.indexOf(parentStructure.id) >= 0) {
    console.log(
      `${childStructure.name} is already a child of ${parentStructure.name}`,
    );
    added = false;
  } else {
    const headers = getHeaders(session);
    headers["content-type"] = "application/json";
    let res = http.put(
      `${rootUrl}/directory/structure/${childStructure.id}/parent/${parentStructure.id}`,
      "{}",
    );
    if (res.status !== 200) {
      fail(
        `Could not attach structure ${childStructure.name} as a child of ${parentStructure.name}`,
      );
    }
    added = true;
  }
  return added;
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
