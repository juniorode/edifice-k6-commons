(function(a,n){typeof exports=="object"&&typeof module<"u"?n(exports,require("k6/http"),require("k6"),require("https://jslib.k6.io/formdata/0.0.2/index.js")):typeof define=="function"&&define.amd?define(["exports","k6/http","k6","https://jslib.k6.io/formdata/0.0.2/index.js"],n):(a=typeof globalThis<"u"?globalThis:a||self,n(a["edifice-k6-commons"]={},a.http,a.k6,a.index_js))})(this,function(a,n,l,O){"use strict";var Y=Object.defineProperty;var Q=(a,n,l)=>n in a?Y(a,n,{enumerable:!0,configurable:!0,writable:!0,value:l}):a[n]=l;var y=(a,n,l)=>(Q(a,typeof n!="symbol"?n+"":n,l),l);const h={COOKIE:0,OAUTH2:1};class S{constructor(e,s,o,r){y(this,"expiresAt");y(this,"token");y(this,"mode");y(this,"cookies");this.token=e,this.mode=s,this.cookies=r,this.expiresAt=Date.now()+o*1e3-3e3}isExpired(){return this.expiresAt<=Date.now()}getCookie(e){return this.cookies?this.cookies.filter(s=>s.name===e).map(s=>s.value)[0]:null}}const U=__ENV.BASE_URL,I=30*60,m=__ENV.ROOT_URL,d=function(t){let e;return t?t.mode===h.COOKIE?e={"x-xsrf-token":t.getCookie("XSRF-TOKEN")||""}:t.mode===h.OAUTH2?e={Authorization:`Bearer ${t.token}`}:e={}:e={},e},N=function(t,e){const s=n.get(`${m}/conversation/visible?search=${t}`,{headers:d(e)});return l.check(s,{"should get an OK response":r=>r.status==200}),s.json("users")[0].id},C=function(t){const e=n.get(`${m}/auth/oauth2/userinfo`,{headers:d(t)});return l.check(e,{"should get an OK response":s=>s.status==200,"should get a valid userId":s=>!!s.json("userId")}),e.json("userId")},E=function(t,e){let s={email:t,password:e,callBack:"",detail:""};const o=n.post(`${m}/auth/login`,s,{redirects:0});l.check(o,{"should redirect connected user to login page":c=>c.status===302,"should have set an auth cookie":c=>c.cookies.oneSessionId!==null&&c.cookies.oneSessionId!==void 0}),n.cookieJar().set(m,"oneSessionId",o.cookies.oneSessionId[0].value);const i=Object.keys(o.cookies).map(c=>({name:c,value:o.cookies[c][0].value}));return new S(o.cookies.oneSessionId[0].value,h.COOKIE,I,i)},j=function(t,e,s,o){let r={grant_type:"password",username:t,password:e,client_id:s,client_secret:o,scope:"timeline userbook blog lvs actualites pronote schoolbook support viescolaire zimbra conversation directory homeworks userinfo workspace portal cas sso presences incidents competences diary edt infra auth"},i=n.post(`${m}/auth/oauth2/token`,r,{redirects:0});l.check(i,{"should get an OK response for authentication":u=>u.status==200,"should have set an access token":u=>!!u.json("access_token")});const c=i.json("access_token");return new S(c,h.OAUTH2,i.json("expires_in"))};function A(t,e){const s=(e||[]).map(o=>o.id);for(let o=0;o<1e3;o++){const r=t[Math.floor(Math.random()*t.length)];if(s.indexOf(r.id)<0)return r}throw"cannot.find.random.user"}const B=function(t,e){const s=n.get(`${U}/metrics`,{headers:d(e)});l.check(s,{"should get an OK response":r=>r.status==200});const o=s.body.split(`
`);for(let r of o)if(r.indexOf(`${t} `)===0)return parseFloat(r.substring(t.length+1).trim());return console.error("Metric",t,"not found"),null},f=__ENV.ROOT_URL;function b(t,e){let s=n.get(`${f}/directory/structure/admin/list`,{headers:d(e)});return JSON.parse(s.body).filter(o=>o.name===t)[0]}function J(t,e){let s=n.get(`${f}/directory/structure/${t.id}/users`,{headers:d(e)});if(s.status!==200)throw`Impossible to get users of ${t.id}`;return JSON.parse(s.body)}function G(t,e){let s=n.get(`${f}/directory/structure/${t.id}/users`,{headers:d(e)});s.status!=200&&l.fail(`Cannot fetch users of structure ${t.id} : ${s}`);const o=JSON.parse(s.body);for(let r=0;r<o.length;r++){const i=o[r];T(i)}}function T(t){if(t.code){const e={};e.login=t.login,e.activationCode=t.code,e.password="password",e.confirmPassword="password",e.acceptCGU="true";const s=n.post(`${f}/auth/activation`,e,{redirects:0,headers:{Host:"localhost"}});s.status!==302&&l.fail(`Could not activate user ${t.login} : ${s}`)}}function V(t,e,s,o){const i=R(t.id,o).filter(c=>s.indexOf(c.name)>=0);for(let c of i)if(c.roles.indexOf(e.name)>=0)console.log("Role already attributed to teachers");else{const u=d(o);u["content-type"]="application/json";const g={headers:u},p=JSON.stringify({groupId:c.id,roleIds:(c.roles||[]).concat([e.id])}),w=n.post(`${f}/appregistry/authorize/group?schoolId=${t.id}`,p,g);l.check(w,{"link role to structure":X=>X.status==200})}}function F(t,e,s){let o=b(t,s);if(o)console.log("School already exists");else{const r=new O.FormData;r.append("type","CSV"),r.append("structureName",t);let i,c,u;"teachers"in e?(i=e.teachers,c=e.students,u=e.responsables):i=e,r.append("Teacher",n.file(i,"enseignants.csv")),c&&r.append("Student",n.file(c,"eleves.csv")),u&&r.append("Relative",n.file(u,"responsables.csv"));const g=d(s);g["Content-Type"]="multipart/form-data; boundary="+r.boundary;const p={headers:g};n.post(`${f}/directory/wizard/import`,r.body(),p).status!=200&&l.fail(`Could not create structure ${t}`),o=b(t,s)}return o}function K(t,e,s){const o=new O.FormData;o.append("type","CSV"),o.append("structureName",t.name),o.append("structureId",t.id),o.append("structureExternalId",t.externalId);let r,i,c;"teachers"in e?(r=e.teachers,i=e.students,c=e.responsables):r=e,o.append("Teacher",n.file(r,"enseignants.csv")),i&&o.append("Student",n.file(i,"eleves.csv")),c&&o.append("Relative",n.file(c,"responsables.csv"));const u=d(s);u["Content-Type"]="multipart/form-data; boundary="+o.boundary;const g={headers:u};return n.post(`${f}/directory/wizard/import`,o.body(),g)}function k(t,e,s){const o=d(s);o["content-type"]="application/json";let r=n.get(`${f}/directory/group/admin/list?translate=false&structureId=${e.id}`,{headers:o});return JSON.parse(r.body).filter(i=>i.subType==="BroadcastGroup"&&i.name===t)[0]}function M(t,e,s){let o=k(t,e,s);if(o)console.log("Broadcast group already existed");else{console.log("Creating broadcast group");const r=d(s);r["content-type"]="application/json";let i=JSON.stringify({name:t,structureId:e.id,subType:"BroadcastGroup"}),c=n.post(`${f}/directory/group`,i,{headers:r});l.check(c,{"create broadcast group":p=>p.status===201});const u=JSON.parse(c.body).id;i=JSON.stringify({name:t,autolinkTargetAllStructs:!0,autolinkTargetStructs:[],autolinkUsersFromGroups:["Teacher"]}),c=n.put(`${f}/directory/group/${u}`,i,{headers:r}),l.check(c,{"set broadcast group for teachers":p=>p.status===200});const g=_(e,s).id;c=n.post(`${f}/communication/v2/group/${g}/communique/${u}`,"{}",{headers:r}),l.check(c,{"open comm rule for broadcast group for teachers":p=>p.status===200}),o=k(t,e,s)}return o}function _(t,e){return R(t.id,e).filter(o=>o.name===`Teachers from group ${t.name}.`||o.name===`Enseignants du groupe ${t.name}.`)[0]}const $=__ENV.ROOT_URL;function v(t,e){let s=n.get(`${$}/appregistry/roles`,{headers:d(e)});return JSON.parse(s.body).filter(r=>r.name===t)[0]}function H(t,e){const s=`${t} - All - Stress Test`;let o=v(s,e);if(o)console.log(`Role ${s} already existed`);else{let r=n.get(`${$}/appregistry/applications/actions?actionType=WORKFLOW`,{headers:d(e)});l.check(r,{"get workflow actions":p=>p.status==200});const c=JSON.parse(r.body).filter(p=>p.name===t)[0].actions.map(p=>p[0]),u=d(e);u["content-type"]="application/json";const g={role:s,actions:c};r=n.post(`${$}/appregistry/role`,JSON.stringify(g),{headers:u}),console.log(r),l.check(r,{"save role ok":p=>p.status==201}),o=v(s,e)}return o}function R(t,e){let s=n.get(`${$}/appregistry/groups/roles?structureId=${t}`,{headers:d(e)});return l.check(s,{"get structure roles should be ok":o=>o.status==200}),JSON.parse(s.body)}const L=__ENV.ROOT_URL;function D(t,e){let s=d(e);const o=new O.FormData;o.append("file",n.file(t,"file.txt")),s["Content-Type"]="multipart/form-data; boundary="+o.boundary;let r=n.post(`${L}/workspace/document`,o.body(),{headers:s});return l.check(r,{"upload doc ok":i=>i.status===201}),JSON.parse(r.body)}const q=__ENV.ROOT_URL;function z(t,e,s){const o=d(s);o["content-type"]="application/json";const r=JSON.stringify(e);return n.put(`${q}/workspace/share/resource/${t}`,r,{headers:o})}const W=__ENV.ROOT_URL;function P(t,e,s){const o=n.post(`${W}/communication/v2/group/${t}/communique/${e}`,"{}",{headers:d(s)});return o.status!==200&&(console.error(`Error while adding communication between ${t} -> ${e}`),console.error(o),l.fail(`could not add communication between ${t} -> ${e}`)),o}a.BASE_URL=U,a.Session=S,a.SessionMode=h,a.activateUser=T,a.activateUsers=G,a.addCommunicationBetweenGroups=P,a.authenticateOAuth2=j,a.authenticateWeb=E,a.createAndSetRole=H,a.createBroadcastGroup=M,a.createStructure=F,a.getBroadcastGroup=k,a.getConnectedUserId=C,a.getHeaders=d,a.getMetricValue=B,a.getRandomUser=A,a.getRoleByName=v,a.getRolesOfStructure=R,a.getSchoolByName=b,a.getTeacherRole=_,a.getUsersOfSchool=J,a.importUsers=K,a.linkRoleToUsers=V,a.searchUser=N,a.shareFile=z,a.uploadFile=D,Object.defineProperty(a,Symbol.toStringTag,{value:"Module"})});
