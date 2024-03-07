import http from "k6/http";
import { check } from "k6";
import { Cookie, Session, SessionMode } from "./authentication.utils.js";

const THIRTY_MINUTES_IN_SECONDS = 30 * 60;

const rootUrl = __ENV.ROOT_URL;

export const getHeaders = function (session: Session): {
  [name: string]: string;
} {
  let headers;
  if (session) {
    if (session.mode === SessionMode.COOKIE) {
      headers = { "x-xsrf-token": session.getCookie("XSRF-TOKEN") || "" };
    } else if (session.mode === SessionMode.OAUTH2) {
      headers = { Authorization: `Bearer ${session.token}` };
    } else {
      headers = {};
    }
  } else {
    headers = {};
  }
  return headers;
};

export const searchUser = function (q: string, session: Session): string {
  const response = http.get(`${rootUrl}/conversation/visible?search=${q}`, {
    headers: getHeaders(session),
  });
  check(response, {
    "should get an OK response": (r) => r.status == 200,
  });
  const users = <any>response.json("users");
  return users[0].id;
};

export const getConnectedUserId = function (session: Session) {
  const response = http.get(`${rootUrl}/auth/oauth2/userinfo`, {
    headers: getHeaders(session),
  });
  check(response, {
    "should get an OK response": (r) => r.status == 200,
    "should get a valid userId": (r) => !!r.json("userId"),
  });
  return response.json("userId");
};

export const authenticateWeb = function (login: string, pwd: string) {
  let credentials = {
    email: login,
    password: pwd,
    callBack: "",
    detail: "",
  };

  const response = http.post(`${rootUrl}/auth/login`, credentials, {
    redirects: 0,
  });
  check(response, {
    "should redirect connected user to login page": (r) => r.status === 302,
    "should have set an auth cookie": (r) =>
      r.cookies["oneSessionId"] !== null &&
      r.cookies["oneSessionId"] !== undefined,
  });
  const jar = http.cookieJar();
  jar.set(rootUrl, "oneSessionId", response.cookies["oneSessionId"][0].value);
  const cookies: Cookie[] = Object.keys(response.cookies).map((cookieName) => {
    return { name: cookieName, value: response.cookies[cookieName][0].value };
  });
  return new Session(
    response.cookies["oneSessionId"][0].value,
    SessionMode.COOKIE,
    THIRTY_MINUTES_IN_SECONDS,
    cookies,
  );
};

export const authenticateOAuth2 = function (
  login: string,
  pwd: string,
  clientId: string,
  clientSecret: string,
) {
  let credentials = {
    grant_type: "password",
    username: login,
    password: pwd,
    client_id: clientId,
    client_secret: clientSecret,
    scope:
      "timeline userbook blog lvs actualites pronote schoolbook support viescolaire zimbra conversation directory homeworks userinfo workspace portal cas sso presences incidents competences diary edt infra auth",
  };

  let response = http.post(`${rootUrl}/auth/oauth2/token`, credentials, {
    redirects: 0,
  });
  check(response, {
    "should get an OK response for authentication": (r) => r.status == 200,
    "should have set an access token": (r) => !!r.json("access_token"),
  });
  const accessToken = <string>response.json("access_token");
  return new Session(
    accessToken,
    SessionMode.OAUTH2,
    <number>response.json("expires_in"),
  );
};

export function getRandomUser(
  arrayOfUsers: { id: string }[],
  exceptUsers: { id: string }[],
) {
  const idToAvoid = (exceptUsers || []).map((u) => u.id);
  for (let i = 0; i < 1000; i++) {
    const user = arrayOfUsers[Math.floor(Math.random() * arrayOfUsers.length)];
    if (idToAvoid.indexOf(user.id) < 0) {
      return user;
    }
  }
  throw "cannot.find.random.user";
}
