import http from "k6/http";
import { getHeaders } from "./user.utils";
import { Role, Session, getRolesOfStructure } from ".";
import { check, bytes } from "k6";
//@ts-ignore
import { FormData } from "https://jslib.k6.io/formdata/0.0.2/index.js";

const rootUrl = __ENV.ROOT_URL;

export type Structure = {
  id: string;
  name: string;
};

export type StructureInitData = {
  teachers: bytes;
  students: bytes;
  responsables: bytes;
};

export function getSchoolByName(name: string, session: Session) {
  let ecoles = http.get(`${rootUrl}/directory/api/ecole`, {
    headers: getHeaders(session),
  });
  const result = JSON.parse(<string>ecoles.body).result;
  let ecoleAudience = Object.keys(result || {})
    .map((k) => result[k])
    .filter((ecole) => ecole.name === name)[0];
  return ecoleAudience;
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
  check(res, {
    "fetch structure users": (r) => r.status == 200,
  });
  const users = JSON.parse(<string>res.body);
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    if (user.code) {
      const fd: any = {};
      fd["login"] = user.login;
      fd["activationCode"] = user.code;
      fd["password"] = "password";
      fd["confirmPassword"] = "password";
      fd["acceptCGU"] = "true";
      res = http.post(`${rootUrl}/auth/activation`, fd, {
        redirects: 0,
        headers: { Host: "localhost" },
      });
      check(res, {
        "activate user": (r) => r.status === 302,
      });
    }
  }
}

export function linkRoleToUsers(
  structure: Structure,
  role: Role,
  session: Session,
  groupNames: string[]
) {
  const roles = getRolesOfStructure(structure.id, session);
  const teacherRoless = roles.filter(
    (role) => groupNames.indexOf(role.name) >=0
  );
  for(let teacherRoles of teacherRoless) {
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
    check(res, {
      "import structure is ok": (r) => r.status == 200,
    });
    ecoleAudience = getSchoolByName(schoolName, session);
  }
  return ecoleAudience;
}
