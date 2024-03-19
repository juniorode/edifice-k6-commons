(function(s,c){typeof exports=="object"&&typeof module<"u"?c(exports,require("k6/http"),require("k6"),require("https://jslib.k6.io/formdata/0.0.2/index.js")):typeof define=="function"&&define.amd?define(["exports","k6/http","k6","https://jslib.k6.io/formdata/0.0.2/index.js"],c):(s=typeof globalThis<"u"?globalThis:s||self,c(s["edifice-k6-commons"]={},s.http,s.k6,s.index_js))})(this,function(s,c,i,S){"use strict";var ae=Object.defineProperty;var le=(s,c,i)=>c in s?ae(s,c,{enumerable:!0,configurable:!0,writable:!0,value:i}):s[c]=i;var y=(s,c,i)=>(le(s,typeof c!="symbol"?c+"":c,i),i);const m={COOKIE:0,OAUTH2:1};class O{constructor(e,t,r,n){y(this,"expiresAt");y(this,"token");y(this,"mode");y(this,"cookies");this.token=e,this.mode=t,this.cookies=n,this.expiresAt=Date.now()+r*1e3-3e3}isExpired(){return this.expiresAt<=Date.now()}getCookie(e){return this.cookies?this.cookies.filter(t=>t.name===e).map(t=>t.value)[0]:null}}const b=__ENV.BASE_URL,A=30*60,k=__ENV.ROOT_URL,u=function(o){let e;return o?o.mode===m.COOKIE?e={"x-xsrf-token":o.getCookie("XSRF-TOKEN")||""}:o.mode===m.OAUTH2?e={Authorization:`Bearer ${o.token}`}:e={}:e={},e},I=function(o,e){const t=c.get(`${k}/conversation/visible?search=${o}`,{headers:u(e)});return i.check(t,{"should get an OK response":n=>n.status==200}),t.json("users")[0].id},D=function(o){const e=c.get(`${k}/auth/oauth2/userinfo`,{headers:u(o)});return i.check(e,{"should get an OK response":t=>t.status==200,"should get a valid userId":t=>!!t.json("userId")}),e.json("userId")},j=function(o,e){let t={email:o,password:e,callBack:"",detail:""};const r=c.post(`${k}/auth/login`,t,{redirects:0});i.check(r,{"should redirect connected user to login page":l=>l.status===302,"should have set an auth cookie":l=>l.cookies.oneSessionId!==null&&l.cookies.oneSessionId!==void 0}),c.cookieJar().set(k,"oneSessionId",r.cookies.oneSessionId[0].value);const a=Object.keys(r.cookies).map(l=>({name:l,value:r.cookies[l][0].value}));return new O(r.cookies.oneSessionId[0].value,m.COOKIE,A,a)},N=function(o){return c.cookieJar().set(k,"oneSessionId",o.token),o},B=function(o,e,t,r){let n={grant_type:"password",username:o,password:e,client_id:t,client_secret:r,scope:"timeline userbook blog lvs actualites pronote schoolbook support viescolaire zimbra conversation directory homeworks userinfo workspace portal cas sso presences incidents competences diary edt infra auth"},a=c.post(`${k}/auth/oauth2/token`,n,{redirects:0});i.check(a,{"should get an OK response for authentication":d=>d.status==200,"should have set an access token":d=>!!d.json("access_token")});const l=a.json("access_token");return new O(l,m.OAUTH2,a.json("expires_in"))};function J(o,e){const t=(e||[]).map(r=>r.id);for(let r=0;r<1e3;r++){const n=o[Math.floor(Math.random()*o.length)];if(t.indexOf(n.id)<0)return n}throw"cannot.find.random.user"}const F=function(o,e){const t=c.get(`${b}/metrics`,{headers:u(e)});i.check(t,{"should get an OK response":n=>n.status==200});const r=t.body.split(`
`);for(let n of r)if(n.indexOf(`${o} `)===0)return parseFloat(n.substring(o.length+1).trim());return console.error("Metric",o,"not found"),null},f=__ENV.ROOT_URL;function h(o,e){let t=c.get(`${f}/directory/structure/admin/list`,{headers:u(e)});return JSON.parse(t.body).filter(r=>r.name===o)[0]}function G(o,e){let t=c.get(`${f}/directory/structure/${o.id}/users`,{headers:u(e)});if(t.status!==200)throw`Impossible to get users of ${o.id}`;return JSON.parse(t.body)}function L(o,e){let t=c.get(`${f}/directory/structure/${o.id}/users`,{headers:u(e)});t.status!=200&&i.fail(`Cannot fetch users of structure ${o.id} : ${t}`);const r=JSON.parse(t.body);for(let n=0;n<r.length;n++){const a=r[n];_(a)}}function _(o){if(o.code){const e={};e.login=o.login,e.activationCode=o.code,e.password="password",e.confirmPassword="password",e.acceptCGU="true";const t=c.post(`${f}/auth/activation`,e,{redirects:0,headers:{Host:"localhost"}});t.status!==302&&i.fail(`Could not activate user ${o.login} : ${t}`)}}function V(o,e,t,r){const a=v(o.id,r).filter(l=>t.indexOf(l.name)>=0);for(let l of a)if(l.roles.indexOf(e.name)>=0)console.log("Role already attributed to teachers");else{const d=u(r);d["content-type"]="application/json";const g={headers:d},p=JSON.stringify({groupId:l.id,roleIds:(l.roles||[]).concat([e.id])}),E=c.post(`${f}/appregistry/authorize/group?schoolId=${o.id}`,p,g);i.check(E,{"link role to structure":ce=>ce.status==200})}}function H(o,e,t){let r=h(o,t);if(r)console.log(`Structure ${o} already exists`);else{const n=u(t);n["content-type"]="application/json";const a=JSON.stringify({hasApp:e,name:o});let l=c.post(`${f}/directory/school`,a,n);l.status!==201&&(console.error(l.body),i.fail(`Could not create structure ${o}`)),r=h(o,t)}return r}function M(o,e,t){let r=h(o,t);if(r)console.log("School already exists");else{const n=new S.FormData;n.append("type","CSV"),n.append("structureName",o);let a,l,d;"teachers"in e?(a=e.teachers,l=e.students,d=e.responsables):a=e,n.append("Teacher",c.file(a,"enseignants.csv")),l&&n.append("Student",c.file(l,"eleves.csv")),d&&n.append("Relative",c.file(d,"responsables.csv"));const g=u(t);g["Content-Type"]="multipart/form-data; boundary="+n.boundary;const p={headers:g};c.post(`${f}/directory/wizard/import`,n.body(),p).status!=200&&i.fail(`Could not create structure ${o}`),r=h(o,t)}return r}function P(o,e,t){let r;if((e.parents||[]).map(a=>a.id).indexOf(o.id)>=0)console.log(`${e.name} is already a child of ${o.name}`),r=!1;else{const a=u(t);a["content-type"]="application/json",c.put(`${f}/directory/structure/${e.id}/parent/${o.id}`,"{}").status!==200&&i.fail(`Could not attach structure ${e.name} as a child of ${o.name}`),r=!0}return r}function K(o,e,t){const r=new S.FormData;r.append("type","CSV"),r.append("structureName",o.name),r.append("structureId",o.id),r.append("structureExternalId",o.externalId);let n,a,l;"teachers"in e?(n=e.teachers,a=e.students,l=e.responsables):n=e,r.append("Teacher",c.file(n,"enseignants.csv")),a&&r.append("Student",c.file(a,"eleves.csv")),l&&r.append("Relative",c.file(l,"responsables.csv"));const d=u(t);d["Content-Type"]="multipart/form-data; boundary="+r.boundary;const g={headers:d};return c.post(`${f}/directory/wizard/import`,r.body(),g)}function q(o){const e=u(o);return e["content-type"]="application/json",c.post(`${f}/directory/import`,"{}",{headers:e})}const w=__ENV.ROOT_URL;function R(o,e){let t=c.get(`${w}/appregistry/roles`,{headers:u(e)});return JSON.parse(t.body).filter(n=>n.name===o)[0]}function z(o,e){const t=`${o} - All - Stress Test`;let r=R(t,e);if(r)console.log(`Role ${t} already existed`);else{let n=c.get(`${w}/appregistry/applications/actions?actionType=WORKFLOW`,{headers:u(e)});i.check(n,{"get workflow actions":p=>p.status==200});const l=JSON.parse(n.body).filter(p=>p.name===o)[0].actions.map(p=>p[0]),d=u(e);d["content-type"]="application/json";const g={role:t,actions:l};n=c.post(`${w}/appregistry/role`,JSON.stringify(g),{headers:d}),console.log(n),i.check(n,{"save role ok":p=>p.status==201}),r=R(t,e)}return r}function v(o,e){const t=u(e);t["Accept-Language"]="en";let r=c.get(`${w}/appregistry/groups/roles?structureId=${o}&translate=false`,{headers:t});return i.check(r,{"get structure roles should be ok":n=>n.status==200}),JSON.parse(r.body)}const X=__ENV.ROOT_URL,Y=["org-entcore-workspace-controllers-WorkspaceController|getDocument","org-entcore-workspace-controllers-WorkspaceController|copyDocuments","org-entcore-workspace-controllers-WorkspaceController|getDocumentProperties","org-entcore-workspace-controllers-WorkspaceController|getRevision","org-entcore-workspace-controllers-WorkspaceController|copyFolder","org-entcore-workspace-controllers-WorkspaceController|getPreview","org-entcore-workspace-controllers-WorkspaceController|copyDocument","org-entcore-workspace-controllers-WorkspaceController|getDocumentBase64","org-entcore-workspace-controllers-WorkspaceController|listRevisions","org-entcore-workspace-controllers-WorkspaceController|commentFolder","org-entcore-workspace-controllers-WorkspaceController|commentDocument","org-entcore-workspace-controllers-WorkspaceController|shareJson","org-entcore-workspace-controllers-WorkspaceController|deleteFolder","org-entcore-workspace-controllers-WorkspaceController|restoreFolder","org-entcore-workspace-controllers-WorkspaceController|removeShare","org-entcore-workspace-controllers-WorkspaceController|moveFolder","org-entcore-workspace-controllers-WorkspaceController|moveTrash","org-entcore-workspace-controllers-WorkspaceController|restoreTrash","org-entcore-workspace-controllers-WorkspaceController|bulkDelete","org-entcore-workspace-controllers-WorkspaceController|shareResource","org-entcore-workspace-controllers-WorkspaceController|deleteRevision","org-entcore-workspace-controllers-WorkspaceController|shareJsonSubmit","org-entcore-workspace-controllers-WorkspaceController|moveDocument","org-entcore-workspace-controllers-WorkspaceController|renameFolder","org-entcore-workspace-controllers-WorkspaceController|moveTrashFolder","org-entcore-workspace-controllers-WorkspaceController|deleteComment","org-entcore-workspace-controllers-WorkspaceController|getParentInfos","org-entcore-workspace-controllers-WorkspaceController|deleteDocument","org-entcore-workspace-controllers-WorkspaceController|renameDocument","org-entcore-workspace-controllers-WorkspaceController|moveDocuments","org-entcore-workspace-controllers-WorkspaceController|updateDocument"],Q=["org-entcore-workspace-controllers-WorkspaceController|getDocument","org-entcore-workspace-controllers-WorkspaceController|copyDocuments","org-entcore-workspace-controllers-WorkspaceController|getDocumentProperties","org-entcore-workspace-controllers-WorkspaceController|getRevision","org-entcore-workspace-controllers-WorkspaceController|copyFolder","org-entcore-workspace-controllers-WorkspaceController|getPreview","org-entcore-workspace-controllers-WorkspaceController|copyDocument","org-entcore-workspace-controllers-WorkspaceController|getDocumentBase64","org-entcore-workspace-controllers-WorkspaceController|listRevisions","org-entcore-workspace-controllers-WorkspaceController|commentFolder","org-entcore-workspace-controllers-WorkspaceController|commentDocument"];function Z(o,e){let t=u(e);const r=new S.FormData;r.append("file",c.file(o,"file.txt")),t["Content-Type"]="multipart/form-data; boundary="+r.boundary;let n=c.post(`${X}/workspace/document`,r.body(),{headers:t});return i.check(n,{"upload doc ok":a=>a.status===201}),JSON.parse(n.body)}const x=__ENV.ROOT_URL;function ee(o,e,t){const r=u(t);r["content-type"]="application/json";const n=JSON.stringify(e);return c.put(`${x}/workspace/share/resource/${o}`,n,{headers:r})}const oe=__ENV.ROOT_URL;function re(o,e,t){const r=c.post(`${oe}/communication/v2/group/${o}/communique/${e}`,"{}",{headers:u(t)});return r.status!==200&&(console.error(`Error while adding communication between ${o} -> ${e}`),console.error(r),i.fail(`could not add communication between ${o} -> ${e}`)),r}const C=__ENV.ROOT_URL;function te(o,e,t){let r=W(o,e,t);if(r)console.log("Broadcast group already existed");else{console.log("Creating broadcast group");const n=u(t);n["content-type"]="application/json";let a=JSON.stringify({name:o,structureId:e.id,subType:"BroadcastGroup"}),l=c.post(`${C}/directory/group`,a,{headers:n});i.check(l,{"create broadcast group":p=>p.status===201});const d=JSON.parse(l.body).id;a=JSON.stringify({name:o,autolinkTargetAllStructs:!0,autolinkTargetStructs:[],autolinkUsersFromGroups:["Teacher"]}),l=c.put(`${C}/directory/group/${d}`,a,{headers:n}),i.check(l,{"set broadcast group for teachers":p=>p.status===200});const g=U(e,t).id;T(d,[g],t),r=W(o,e,t)}return r}function T(o,e,t){const r=u(t);r["content-type"]="application/json";for(let n of e){let a=c.post(`${C}/communication/v2/group/${n}/communique/${o}`,"{}",{headers:r});a.status!==200&&(console.error(a),i.fail(`Cannot open comm rule from ${n} to ${o}`))}}function U(o,e){return $("teachers",o,e)}function ne(o,e){return $("students",o,e)}function se(o,e){return $("relatives",o,e)}function $(o,e,t){return v(e.id,t).filter(n=>{const a=n.name.toLowerCase();return a===`${e.name} group ${o}.`.toLowerCase()||a===`${o} from group ${e.name}.`.toLowerCase()})[0]}function W(o,e,t){const r=u(t);r["content-type"]="application/json";let n=c.get(`${C}/directory/group/admin/list?translate=false&structureId=${e.id}`,{headers:r});return JSON.parse(n.body).filter(a=>a.subType==="BroadcastGroup"&&a.name===o)[0]}s.BASE_URL=b,s.Session=O,s.SessionMode=m,s.WS_MANAGER_SHARE=Y,s.WS_READER_SHARE=Q,s.activateUser=_,s.activateUsers=L,s.addCommRuleToGroup=T,s.addCommunicationBetweenGroups=re,s.attachStructureAsChild=P,s.authenticateOAuth2=B,s.authenticateWeb=j,s.createAndSetRole=z,s.createBroadcastGroup=te,s.createEmptyStructure=H,s.createStructure=M,s.getBroadcastGroup=W,s.getConnectedUserId=D,s.getHeaders=u,s.getMetricValue=F,s.getParentRole=se,s.getProfileGroupOfStructure=$,s.getRandomUser=J,s.getRoleByName=R,s.getRolesOfStructure=v,s.getSchoolByName=h,s.getStudentRole=ne,s.getTeacherRole=U,s.getUsersOfSchool=G,s.importUsers=K,s.linkRoleToUsers=V,s.searchUser=I,s.shareFile=ee,s.switchSession=N,s.triggerImport=q,s.uploadFile=Z,Object.defineProperty(s,Symbol.toStringTag,{value:"Module"})});
