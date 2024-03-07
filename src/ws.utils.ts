import http from "k6/http";
import { getHeaders } from "./user.utils";
import { Session } from ".";
import { check, bytes } from "k6";
//@ts-ignore
import { FormData } from "https://jslib.k6.io/formdata/0.0.2/index.js";

const rootUrl = __ENV.ROOT_URL;

export type WorkspaceFile = {
  name: string;
  metadata: {
    name: string;
    filename: string;
    "content-type": string;
  };
  file: string;
  shared: any[];
  inheritedShares: any[];
  isShared: boolean;
  owner: string;
  _id: string;
};

export function uploadFile(fileData: bytes, session: Session): WorkspaceFile {
  let headers = getHeaders(session);
  const fd = new FormData();
  //@ts-ignore
  fd.append("file", http.file(fileData, "file.txt"));
  //@ts-ignore
  headers["Content-Type"] = "multipart/form-data; boundary=" + fd.boundary;
  let res = http.post(`${rootUrl}/workspace/document`, fd.body(), { headers });
  check(res, {
    "upload doc ok": (r) => r.status === 201,
  });
  return JSON.parse(<string>res.body);
}
