export const SessionMode = {
  COOKIE: 0,
  OAUTH2: 1,
};
export type Cookie = {
  name: string;
  value: string;
};

export class Session {
  expiresAt: number;
  token: string;
  mode: number;
  cookies?: Cookie[];
  constructor(
    token: string,
    mode: number,
    expiresIn: number,
    cookies?: Cookie[],
  ) {
    this.token = token;
    this.mode = mode;
    this.cookies = cookies;
    this.expiresAt = Date.now() + expiresIn * 1000 - 3000;
  }
  isExpired() {
    return this.expiresAt <= Date.now();
  }
  getCookie(cookieName: string) {
    return this.cookies
      ? this.cookies
          .filter((cookie) => cookie.name === cookieName)
          .map((cookie) => cookie.value)[0]
      : null;
  }
}
