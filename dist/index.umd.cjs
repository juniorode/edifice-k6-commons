(function(a,n){typeof exports=="object"&&typeof module<"u"?n(exports,require("k6/http"),require("k6"),require("https://jslib.k6.io/formdata/0.0.2/index.js")):typeof define=="function"&&define.amd?define(["exports","k6/http","k6","https://jslib.k6.io/formdata/0.0.2/index.js"],n):(a=typeof globalThis<"u"?globalThis:a||self,n(a["edifice-k6-commons"]={},a.http,a.k6,a.index_js))})(this,function(a,n,l,S){"use strict";var W=Object.defineProperty;var P=(a,n,l)=>n in a?W(a,n,{enumerable:!0,configurable:!0,writable:!0,value:l}):a[n]=l;var m=(a,n,l)=>(P(a,typeof n!="symbol"?n+"":n,l),l);const h={COOKIE:0,OAUTH2:1};class ${constructor(e,s,o,r){m(this,"expiresAt");m(this,"token");m(this,"mode");m(this,"cookies");this.token=e,this.mode=s,this.cookies=r,this.expiresAt=Date.now()+o*1e3-3e3}isExpired(){return this.expiresAt<=Date.now()}getCookie(e){return this.cookies?this.cookies.filter(s=>s.name===e).map(s=>s.value)[0]:null}}const U=__ENV.BASE_URL,_=30*60,y=__ENV.ROOT_URL,p=function(t){let e;return t?t.mode===h.COOKIE?e={"x-xsrf-token":t.getCookie("XSRF-TOKEN")||""}:t.mode===h.OAUTH2?e={Authorization:`Bearer ${t.token}`}:e={}:e={},e},I=function(t,e){const s=n.get(`${y}/conversation/visible?search=${t}`,{headers:p(e)});return l.check(s,{"should get an OK response":r=>r.status==200}),s.json("users")[0].id},w=function(t){const e=n.get(`${y}/auth/oauth2/userinfo`,{headers:p(t)});return l.check(e,{"should get an OK response":s=>s.status==200,"should get a valid userId":s=>!!s.json("userId")}),e.json("userId")},N=function(t,e){let s={email:t,password:e,callBack:"",detail:""};const o=n.post(`${y}/auth/login`,s,{redirects:0});l.check(o,{"should redirect connected user to login page":c=>c.status===302,"should have set an auth cookie":c=>c.cookies.oneSessionId!==null&&c.cookies.oneSessionId!==void 0}),n.cookieJar().set(y,"oneSessionId",o.cookies.oneSessionId[0].value);const i=Object.keys(o.cookies).map(c=>({name:c,value:o.cookies[c][0].value}));return new $(o.cookies.oneSessionId[0].value,h.COOKIE,_,i)},A=function(t,e,s,o){let r={grant_type:"password",username:t,password:e,client_id:s,client_secret:o,scope:"timeline userbook blog lvs actualites pronote schoolbook support viescolaire zimbra conversation directory homeworks userinfo workspace portal cas sso presences incidents competences diary edt infra auth"},i=n.post(`${y}/auth/oauth2/token`,r,{redirects:0});l.check(i,{"should get an OK response for authentication":d=>d.status==200,"should have set an access token":d=>!!d.json("access_token")});const c=i.json("access_token");return new $(c,h.OAUTH2,i.json("expires_in"))};function j(t,e){const s=(e||[]).map(o=>o.id);for(let o=0;o<1e3;o++){const r=t[Math.floor(Math.random()*t.length)];if(s.indexOf(r.id)<0)return r}throw"cannot.find.random.user"}const C=function(t,e){const s=n.get(`${U}/metrics`,{headers:p(e)});l.check(s,{"should get an OK response":r=>r.status==200});const o=s.body.split(`
`);for(let r of o)if(r.indexOf(`${t} `)===0)return parseFloat(r.substring(t.length+1).trim());return console.error("Metric",t,"not found"),null},f=__ENV.ROOT_URL;function k(t,e){let s=n.get(`${f}/directory/api/ecole`,{headers:p(e)});const o=JSON.parse(s.body).result;return Object.keys(o||{}).map(i=>o[i]).filter(i=>i.name===t)[0]}function E(t,e){let s=n.get(`${f}/directory/structure/${t.id}/users`,{headers:p(e)});if(s.status!==200)throw`Impossible to get users of ${t.id}`;return JSON.parse(s.body)}function J(t,e){let s=n.get(`${f}/directory/structure/${t.id}/users`,{headers:p(e)});s.status!=200&&l.fail(`Cannot fetch users of structure ${t.id} : ${s}`);const o=JSON.parse(s.body);for(let r=0;r<o.length;r++){const i=o[r];R(i)}}function R(t){if(t.code){const e={};e.login=t.login,e.activationCode=t.code,e.password="password",e.confirmPassword="password",e.acceptCGU="true";const s=n.post(`${f}/auth/activation`,e,{redirects:0,headers:{Host:"localhost"}});s.status!==302&&l.fail(`Could not activate user ${t.login} : ${s}`)}}function B(t,e,s,o){const i=v(t.id,o).filter(c=>s.indexOf(c.name)>=0);for(let c of i)if(c.roles.indexOf(e.name)>=0)console.log("Role already attributed to teachers");else{const d=p(o);d["content-type"]="application/json";const g={headers:d},u=JSON.stringify({groupId:c.id,roleIds:(c.roles||[]).concat([e.id])}),T=n.post(`${f}/appregistry/authorize/group?schoolId=${t.id}`,u,g);l.check(T,{"link role to structure":q=>q.status==200})}}function F(t,e,s){let o=k(t,s);if(o)console.log("School already exists");else{const r=new S.FormData;r.append("type","CSV"),r.append("structureName",t);let i,c,d;"teachers"in e?(i=e.teachers,c=e.students,d=e.responsables):i=e,r.append("Teacher",n.file(i,"enseignants.csv")),c&&r.append("Student",n.file(c,"eleves.csv")),d&&r.append("Relative",n.file(d,"responsables.csv"));const g=p(s);g["Content-Type"]="multipart/form-data; boundary="+r.boundary;const u={headers:g};n.post(`${f}/directory/wizard/import`,r.body(),u).status!=200&&l.fail(`Could not create structure ${t}`),o=k(t,s)}return o}function V(t,e,s){const o=new S.FormData;o.append("type","CSV"),o.append("structureName",t.name),o.append("structureId",t.id);let r,i,c;"teachers"in e?(r=e.teachers,i=e.students,c=e.responsables):r=e,o.append("Teacher",n.file(r,"enseignants.csv")),i&&o.append("Student",n.file(i,"eleves.csv")),c&&o.append("Relative",n.file(c,"responsables.csv"));const d=p(s);d["Content-Type"]="multipart/form-data; boundary="+o.boundary;const g={headers:d};return n.post(`${f}/directory/wizard/import`,o.body(),g)}function K(t,e,s){const o=p(s);o["content-type"]="application/json";let r=n.get(`${f}/directory/group/admin/list?translate=false&structureId=${e.id}`,{headers:o}),i=JSON.parse(r.body).filter(c=>c.subType==="BroadcastGroup"&&c.name===t)[0];if(i)console.log("Broadcast group already existed");else{console.log("Creating broadcast group");let c=JSON.stringify({name:t,structureId:e.id,subType:"BroadcastGroup"});r=n.post(`${f}/directory/group`,c,{headers:o}),l.check(r,{"create broadcast group":u=>u.status===201});const d=JSON.parse(r.body).id;c=JSON.stringify({name:t,autolinkTargetAllStructs:!0,autolinkTargetStructs:[],autolinkUsersFromGroups:["Teacher"]}),r=n.put(`${f}/directory/group/${d}`,c,{headers:o}),l.check(r,{"set broadcast group for teachers":u=>u.status===200});const g=M(e,s).id;r=n.post(`${f}/communication/v2/group/${g}/communique/${d}`,"{}",{headers:o}),l.check(r,{"open comm rule for broadcast group for teachers":u=>u.status===200}),r=n.get(`${f}/communication/group/${d}`,{headers:o}),i=JSON.parse(r.body)}return i}function M(t,e){return v(t.id,e).filter(o=>o.name===`Teachers from group ${t.name}.`||o.name===`Enseignants du groupe ${t.name}.`)[0]}const O=__ENV.ROOT_URL;function b(t,e){let s=n.get(`${O}/appregistry/roles`,{headers:p(e)});return JSON.parse(s.body).filter(r=>r.name===t)[0]}function G(t,e){const s=`${t} - All - Stress Test`;let o=b(s,e);if(o)console.log(`Role ${s} already existed`);else{let r=n.get(`${O}/appregistry/applications/actions?actionType=WORKFLOW`,{headers:p(e)});l.check(r,{"get workflow actions":u=>u.status==200});const c=JSON.parse(r.body).filter(u=>u.name===t)[0].actions.map(u=>u[0]),d=p(e);d["content-type"]="application/json";const g={role:s,actions:c};r=n.post(`${O}/appregistry/role`,JSON.stringify(g),{headers:d}),console.log(r),l.check(r,{"save role ok":u=>u.status==201}),o=b(s,e)}return o}function v(t,e){let s=n.get(`${O}/appregistry/groups/roles?structureId=${t}`,{headers:p(e)});return l.check(s,{"get structure roles should be ok":o=>o.status==200}),JSON.parse(s.body)}const H=__ENV.ROOT_URL;function L(t,e){let s=p(e);const o=new S.FormData;o.append("file",n.file(t,"file.txt")),s["Content-Type"]="multipart/form-data; boundary="+o.boundary;let r=n.post(`${H}/workspace/document`,o.body(),{headers:s});return l.check(r,{"upload doc ok":i=>i.status===201}),JSON.parse(r.body)}const D=__ENV.ROOT_URL;function z(t,e,s){const o=p(s);o["content-type"]="application/json";const r=JSON.stringify(e);return n.put(`${D}/workspace/share/resource/${t}`,r,{headers:o})}a.BASE_URL=U,a.Session=$,a.SessionMode=h,a.activateUser=R,a.activateUsers=J,a.authenticateOAuth2=A,a.authenticateWeb=N,a.createAndSetRole=G,a.createBroadcastGroup=K,a.createStructure=F,a.getConnectedUserId=w,a.getHeaders=p,a.getMetricValue=C,a.getRandomUser=j,a.getRoleByName=b,a.getRolesOfStructure=v,a.getSchoolByName=k,a.getUsersOfSchool=E,a.importUsers=V,a.linkRoleToUsers=B,a.searchUser=I,a.shareFile=z,a.uploadFile=L,Object.defineProperty(a,Symbol.toStringTag,{value:"Module"})});
