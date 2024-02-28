import http from 'k6/http';
import { getHeaders } from './user.utils';
import { Session } from '.';

const rootUrl = __ENV.ROOT_URL;

export type Structure = {
  id: string,
  name: string
}

export function getSchoolByName(name: string, session: Session) {
    let ecoles = http.get(`${rootUrl}/directory/api/ecole`, {headers: getHeaders(session)})
    const result = JSON.parse(<string>ecoles.body).result;
    let ecoleAudience = Object.keys(result || {})
      .map(k => result[k])
      .filter(ecole => ecole.name === name) [0];
    return ecoleAudience
  }


export function getUsersOfSchool(school: Structure, session: Session) {
    let res = http.get(`${rootUrl}/directory/structure/${school.id}/users`, { headers: getHeaders(session) })
    if( res.status !== 200) {
        throw `Impossible to get users of ${school.id}`
    }
    return JSON.parse(<string>res.body);
}