(function(a,n){typeof exports=="object"&&typeof module<"u"?n(exports,require("k6/http"),require("k6"),require("https://jslib.k6.io/formdata/0.0.2/index.js")):typeof define=="function"&&define.amd?define(["exports","k6/http","k6","https://jslib.k6.io/formdata/0.0.2/index.js"],n):(a=typeof globalThis<"u"?globalThis:a||self,n(a["edifice-k6-commons"]={},a.http,a.k6,a.index_js))})(this,function(a,n,l,S){"use strict";var Z=Object.defineProperty;var x=(a,n,l)=>n in a?Z(a,n,{enumerable:!0,configurable:!0,writable:!0,value:l}):a[n]=l;var $=(a,n,l)=>(x(a,typeof n!="symbol"?n+"":n,l),l);const h={COOKIE:0,OAUTH2:1};class b{constructor(t,s,o,r){$(this,"expiresAt");$(this,"token");$(this,"mode");$(this,"cookies");this.token=t,this.mode=s,this.cookies=r,this.expiresAt=Date.now()+o*1e3-3e3}isExpired(){return this.expiresAt<=Date.now()}getCookie(t){return this.cookies?this.cookies.filter(s=>s.name===t).map(s=>s.value)[0]:null}}const U=__ENV.BASE_URL,C=30*60,y=__ENV.ROOT_URL,u=function(e){let t;return e?e.mode===h.COOKIE?t={"x-xsrf-token":e.getCookie("XSRF-TOKEN")||""}:e.mode===h.OAUTH2?t={Authorization:`Bearer ${e.token}`}:t={}:t={},t},I=function(e,t){const s=n.get(`${y}/conversation/visible?search=${e}`,{headers:u(t)});return l.check(s,{"should get an OK response":r=>r.status==200}),s.json("users")[0].id},E=function(e){const t=n.get(`${y}/auth/oauth2/userinfo`,{headers:u(e)});return l.check(t,{"should get an OK response":s=>s.status==200,"should get a valid userId":s=>!!s.json("userId")}),t.json("userId")},j=function(e,t){let s={email:e,password:t,callBack:"",detail:""};const o=n.post(`${y}/auth/login`,s,{redirects:0});l.check(o,{"should redirect connected user to login page":c=>c.status===302,"should have set an auth cookie":c=>c.cookies.oneSessionId!==null&&c.cookies.oneSessionId!==void 0}),n.cookieJar().set(y,"oneSessionId",o.cookies.oneSessionId[0].value);const i=Object.keys(o.cookies).map(c=>({name:c,value:o.cookies[c][0].value}));return new b(o.cookies.oneSessionId[0].value,h.COOKIE,C,i)},A=function(e,t,s,o){let r={grant_type:"password",username:e,password:t,client_id:s,client_secret:o,scope:"timeline userbook blog lvs actualites pronote schoolbook support viescolaire zimbra conversation directory homeworks userinfo workspace portal cas sso presences incidents competences diary edt infra auth"},i=n.post(`${y}/auth/oauth2/token`,r,{redirects:0});l.check(i,{"should get an OK response for authentication":d=>d.status==200,"should have set an access token":d=>!!d.json("access_token")});const c=i.json("access_token");return new b(c,h.OAUTH2,i.json("expires_in"))};function N(e,t){const s=(t||[]).map(o=>o.id);for(let o=0;o<1e3;o++){const r=e[Math.floor(Math.random()*e.length)];if(s.indexOf(r.id)<0)return r}throw"cannot.find.random.user"}const B=function(e,t){const s=n.get(`${U}/metrics`,{headers:u(t)});l.check(s,{"should get an OK response":r=>r.status==200});const o=s.body.split(`
`);for(let r of o)if(r.indexOf(`${e} `)===0)return parseFloat(r.substring(e.length+1).trim());return console.error("Metric",e,"not found"),null},f=__ENV.ROOT_URL;function m(e,t){let s=n.get(`${f}/directory/structure/admin/list`,{headers:u(t)});return JSON.parse(s.body).filter(o=>o.name===e)[0]}function J(e,t){let s=n.get(`${f}/directory/structure/${e.id}/users`,{headers:u(t)});if(s.status!==200)throw`Impossible to get users of ${e.id}`;return JSON.parse(s.body)}function G(e,t){let s=n.get(`${f}/directory/structure/${e.id}/users`,{headers:u(t)});s.status!=200&&l.fail(`Cannot fetch users of structure ${e.id} : ${s}`);const o=JSON.parse(s.body);for(let r=0;r<o.length;r++){const i=o[r];T(i)}}function T(e){if(e.code){const t={};t.login=e.login,t.activationCode=e.code,t.password="password",t.confirmPassword="password",t.acceptCGU="true";const s=n.post(`${f}/auth/activation`,t,{redirects:0,headers:{Host:"localhost"}});s.status!==302&&l.fail(`Could not activate user ${e.login} : ${s}`)}}function V(e,t,s,o){const i=R(e.id,o).filter(c=>s.indexOf(c.name)>=0);for(let c of i)if(c.roles.indexOf(t.name)>=0)console.log("Role already attributed to teachers");else{const d=u(o);d["content-type"]="application/json";const g={headers:d},p=JSON.stringify({groupId:c.id,roleIds:(c.roles||[]).concat([t.id])}),w=n.post(`${f}/appregistry/authorize/group?schoolId=${e.id}`,p,g);l.check(w,{"link role to structure":Q=>Q.status==200})}}function F(e,t,s){let o=m(e,s);if(o)console.log(`Structure ${e} already exists`);else{const r=u(s);r["content-type"]="application/json";const i=JSON.stringify({hasApp:t,name:e});let c=n.post(`${f}/directory/school`,i,r);c.status!==201&&(console.error(c.body),l.fail(`Could not create structure ${e}`)),o=m(e,s)}return o}function K(e,t,s){let o=m(e,s);if(o)console.log("School already exists");else{const r=new S.FormData;r.append("type","CSV"),r.append("structureName",e);let i,c,d;"teachers"in t?(i=t.teachers,c=t.students,d=t.responsables):i=t,r.append("Teacher",n.file(i,"enseignants.csv")),c&&r.append("Student",n.file(c,"eleves.csv")),d&&r.append("Relative",n.file(d,"responsables.csv"));const g=u(s);g["Content-Type"]="multipart/form-data; boundary="+r.boundary;const p={headers:g};n.post(`${f}/directory/wizard/import`,r.body(),p).status!=200&&l.fail(`Could not create structure ${e}`),o=m(e,s)}return o}function M(e,t,s){const o=u(s);o["content-type"]="application/json";let r=n.put(`${f}/directory/structure/${t.id}/parent/${e.id}`,"{}");return r.status!==200&&l.fail(`Could not attach structure ${t.name} as a child of ${e.name}`),r}function H(e,t,s){const o=new S.FormData;o.append("type","CSV"),o.append("structureName",e.name),o.append("structureId",e.id),o.append("structureExternalId",e.externalId);let r,i,c;"teachers"in t?(r=t.teachers,i=t.students,c=t.responsables):r=t,o.append("Teacher",n.file(r,"enseignants.csv")),i&&o.append("Student",n.file(i,"eleves.csv")),c&&o.append("Relative",n.file(c,"responsables.csv"));const d=u(s);d["Content-Type"]="multipart/form-data; boundary="+o.boundary;const g={headers:d};return n.post(`${f}/directory/wizard/import`,o.body(),g)}function k(e,t,s){const o=u(s);o["content-type"]="application/json";let r=n.get(`${f}/directory/group/admin/list?translate=false&structureId=${t.id}`,{headers:o});return JSON.parse(r.body).filter(i=>i.subType==="BroadcastGroup"&&i.name===e)[0]}function L(e,t,s){let o=k(e,t,s);if(o)console.log("Broadcast group already existed");else{console.log("Creating broadcast group");const r=u(s);r["content-type"]="application/json";let i=JSON.stringify({name:e,structureId:t.id,subType:"BroadcastGroup"}),c=n.post(`${f}/directory/group`,i,{headers:r});l.check(c,{"create broadcast group":p=>p.status===201});const d=JSON.parse(c.body).id;i=JSON.stringify({name:e,autolinkTargetAllStructs:!0,autolinkTargetStructs:[],autolinkUsersFromGroups:["Teacher"]}),c=n.put(`${f}/directory/group/${d}`,i,{headers:r}),l.check(c,{"set broadcast group for teachers":p=>p.status===200});const g=_(t,s).id;c=n.post(`${f}/communication/v2/group/${g}/communique/${d}`,"{}",{headers:r}),l.check(c,{"open comm rule for broadcast group for teachers":p=>p.status===200}),o=k(e,t,s)}return o}function _(e,t){return R(e.id,t).filter(o=>o.name===`Teachers from group ${e.name}.`||o.name===`Enseignants du groupe ${e.name}.`)[0]}const O=__ENV.ROOT_URL;function v(e,t){let s=n.get(`${O}/appregistry/roles`,{headers:u(t)});return JSON.parse(s.body).filter(r=>r.name===e)[0]}function D(e,t){const s=`${e} - All - Stress Test`;let o=v(s,t);if(o)console.log(`Role ${s} already existed`);else{let r=n.get(`${O}/appregistry/applications/actions?actionType=WORKFLOW`,{headers:u(t)});l.check(r,{"get workflow actions":p=>p.status==200});const c=JSON.parse(r.body).filter(p=>p.name===e)[0].actions.map(p=>p[0]),d=u(t);d["content-type"]="application/json";const g={role:s,actions:c};r=n.post(`${O}/appregistry/role`,JSON.stringify(g),{headers:d}),console.log(r),l.check(r,{"save role ok":p=>p.status==201}),o=v(s,t)}return o}function R(e,t){let s=n.get(`${O}/appregistry/groups/roles?structureId=${e}`,{headers:u(t)});return l.check(s,{"get structure roles should be ok":o=>o.status==200}),JSON.parse(s.body)}const q=__ENV.ROOT_URL;function z(e,t){let s=u(t);const o=new S.FormData;o.append("file",n.file(e,"file.txt")),s["Content-Type"]="multipart/form-data; boundary="+o.boundary;let r=n.post(`${q}/workspace/document`,o.body(),{headers:s});return l.check(r,{"upload doc ok":i=>i.status===201}),JSON.parse(r.body)}const W=__ENV.ROOT_URL;function P(e,t,s){const o=u(s);o["content-type"]="application/json";const r=JSON.stringify(t);return n.put(`${W}/workspace/share/resource/${e}`,r,{headers:o})}const X=__ENV.ROOT_URL;function Y(e,t,s){const o=n.post(`${X}/communication/v2/group/${e}/communique/${t}`,"{}",{headers:u(s)});return o.status!==200&&(console.error(`Error while adding communication between ${e} -> ${t}`),console.error(o),l.fail(`could not add communication between ${e} -> ${t}`)),o}a.BASE_URL=U,a.Session=b,a.SessionMode=h,a.activateUser=T,a.activateUsers=G,a.addCommunicationBetweenGroups=Y,a.attachStructureAsChild=M,a.authenticateOAuth2=A,a.authenticateWeb=j,a.createAndSetRole=D,a.createBroadcastGroup=L,a.createEmptyStructure=F,a.createStructure=K,a.getBroadcastGroup=k,a.getConnectedUserId=E,a.getHeaders=u,a.getMetricValue=B,a.getRandomUser=N,a.getRoleByName=v,a.getRolesOfStructure=R,a.getSchoolByName=m,a.getTeacherRole=_,a.getUsersOfSchool=J,a.importUsers=H,a.linkRoleToUsers=V,a.searchUser=I,a.shareFile=P,a.uploadFile=z,Object.defineProperty(a,Symbol.toStringTag,{value:"Module"})});
