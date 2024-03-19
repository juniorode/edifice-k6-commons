import http from "k6/http";
import { getHeaders } from "./user.utils";
import { BroadcastGroup, Session, Structure, getRolesOfStructure } from ".";
import { check, fail } from "k6";

const rootUrl = __ENV.ROOT_URL;

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
    addCommRuleToGroup(blId, [teacherGroupId], session);
    broadcastGroup = getBroadcastGroup(broadcastListName, school, session);
  }
  return broadcastGroup;
}

export function addCommRuleToGroup(
  groupId: string,
  fromGroupIds: string[],
  session: Session,
) {
  const headers = getHeaders(session);
  headers["content-type"] = "application/json";
  for (let fromGroupId of fromGroupIds) {
    let res = http.post(
      `${rootUrl}/communication/v2/group/${fromGroupId}/communique/${groupId}`,
      "{}",
      { headers },
    );
    if (res.status !== 200) {
      console.error(res);
      fail(`Cannot open comm rule from ${fromGroupId} to ${groupId}`);
    }
  }
}

export function getTeacherRole(structure: Structure, session: Session) {
  return getProfileGroupOfStructure("teachers", structure, session);
}

export function getStudentRole(structure: Structure, session: Session) {
  return getProfileGroupOfStructure("students", structure, session);
}

export function getParentRole(structure: Structure, session: Session) {
  return getProfileGroupOfStructure("relatives", structure, session);
}

export function getProfileGroupOfStructure(
  profileGroupName: string,
  structure: Structure,
  session: Session,
) {
  const roles = getRolesOfStructure(structure.id, session);
  return roles.filter((role) => {
    const lowerName = role.name.toLowerCase();
    return (
      lowerName ===
        `${structure.name} group ${profileGroupName}.`.toLowerCase() ||
      lowerName ===
        `${profileGroupName} from group ${structure.name}.`.toLowerCase()
    );
  })[0];
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
