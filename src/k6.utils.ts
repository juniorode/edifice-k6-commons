import { fail } from "k6";

export function assertOk(res: any, label: string, code: number = 200) {
  const _code = code || 200;
  if (res.status != _code) {
    console.error(`ko - ${label}. Expecting ${_code} but got ${res.status}`);
    console.error(res);
    fail(label + " ko");
  }
}
