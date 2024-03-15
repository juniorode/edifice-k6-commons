(function(n,c){typeof exports=="object"&&typeof module<"u"?c(exports,require("k6/http"),require("k6"),require("https://jslib.k6.io/formdata/0.0.2/index.js")):typeof define=="function"&&define.amd?define(["exports","k6/http","k6","https://jslib.k6.io/formdata/0.0.2/index.js"],c):(n=typeof globalThis<"u"?globalThis:n||self,c(n["edifice-k6-commons"]={},n.http,n.k6,n.index_js))})(this,function(n,c,i,$){"use strict";var te=Object.defineProperty;var se=(n,c,i)=>c in n?te(n,c,{enumerable:!0,configurable:!0,writable:!0,value:i}):n[c]=i;var y=(n,c,i)=>(se(n,typeof c!="symbol"?c+"":c,i),i);const m={COOKIE:0,OAUTH2:1};class S{constructor(o,t,r,s){y(this,"expiresAt");y(this,"token");y(this,"mode");y(this,"cookies");this.token=o,this.mode=t,this.cookies=s,this.expiresAt=Date.now()+r*1e3-3e3}isExpired(){return this.expiresAt<=Date.now()}getCookie(o){return this.cookies?this.cookies.filter(t=>t.name===o).map(t=>t.value)[0]:null}}const v=__ENV.BASE_URL,E=30*60,k=__ENV.ROOT_URL,d=function(e){let o;return e?e.mode===m.COOKIE?o={"x-xsrf-token":e.getCookie("XSRF-TOKEN")||""}:e.mode===m.OAUTH2?o={Authorization:`Bearer ${e.token}`}:o={}:o={},o},A=function(e,o){const t=c.get(`${k}/conversation/visible?search=${e}`,{headers:d(o)});return i.check(t,{"should get an OK response":s=>s.status==200}),t.json("users")[0].id},I=function(e){const o=c.get(`${k}/auth/oauth2/userinfo`,{headers:d(e)});return i.check(o,{"should get an OK response":t=>t.status==200,"should get a valid userId":t=>!!t.json("userId")}),o.json("userId")},D=function(e,o){let t={email:e,password:o,callBack:"",detail:""};const r=c.post(`${k}/auth/login`,t,{redirects:0});i.check(r,{"should redirect connected user to login page":l=>l.status===302,"should have set an auth cookie":l=>l.cookies.oneSessionId!==null&&l.cookies.oneSessionId!==void 0}),c.cookieJar().set(k,"oneSessionId",r.cookies.oneSessionId[0].value);const a=Object.keys(r.cookies).map(l=>({name:l,value:r.cookies[l][0].value}));return new S(r.cookies.oneSessionId[0].value,m.COOKIE,E,a)},j=function(e){return c.cookieJar().set(k,"oneSessionId",e.token),e},N=function(e,o,t,r){let s={grant_type:"password",username:e,password:o,client_id:t,client_secret:r,scope:"timeline userbook blog lvs actualites pronote schoolbook support viescolaire zimbra conversation directory homeworks userinfo workspace portal cas sso presences incidents competences diary edt infra auth"},a=c.post(`${k}/auth/oauth2/token`,s,{redirects:0});i.check(a,{"should get an OK response for authentication":u=>u.status==200,"should have set an access token":u=>!!u.json("access_token")});const l=a.json("access_token");return new S(l,m.OAUTH2,a.json("expires_in"))};function B(e,o){const t=(o||[]).map(r=>r.id);for(let r=0;r<1e3;r++){const s=e[Math.floor(Math.random()*e.length)];if(t.indexOf(s.id)<0)return s}throw"cannot.find.random.user"}const J=function(e,o){const t=c.get(`${v}/metrics`,{headers:d(o)});i.check(t,{"should get an OK response":s=>s.status==200});const r=t.body.split(`
`);for(let s of r)if(s.indexOf(`${e} `)===0)return parseFloat(s.substring(e.length+1).trim());return console.error("Metric",e,"not found"),null},g=__ENV.ROOT_URL;function h(e,o){let t=c.get(`${g}/directory/structure/admin/list`,{headers:d(o)});return JSON.parse(t.body).filter(r=>r.name===e)[0]}function F(e,o){let t=c.get(`${g}/directory/structure/${e.id}/users`,{headers:d(o)});if(t.status!==200)throw`Impossible to get users of ${e.id}`;return JSON.parse(t.body)}function G(e,o){let t=c.get(`${g}/directory/structure/${e.id}/users`,{headers:d(o)});t.status!=200&&i.fail(`Cannot fetch users of structure ${e.id} : ${t}`);const r=JSON.parse(t.body);for(let s=0;s<r.length;s++){const a=r[s];b(a)}}function b(e){if(e.code){const o={};o.login=e.login,o.activationCode=e.code,o.password="password",o.confirmPassword="password",o.acceptCGU="true";const t=c.post(`${g}/auth/activation`,o,{redirects:0,headers:{Host:"localhost"}});t.status!==302&&i.fail(`Could not activate user ${e.login} : ${t}`)}}function V(e,o,t,r){const a=R(e.id,r).filter(l=>t.indexOf(l.name)>=0);for(let l of a)if(l.roles.indexOf(o.name)>=0)console.log("Role already attributed to teachers");else{const u=d(r);u["content-type"]="application/json";const f={headers:u},p=JSON.stringify({groupId:l.id,roleIds:(l.roles||[]).concat([o.id])}),U=c.post(`${g}/appregistry/authorize/group?schoolId=${e.id}`,p,f);i.check(U,{"link role to structure":re=>re.status==200})}}function H(e,o,t){let r=h(e,t);if(r)console.log(`Structure ${e} already exists`);else{const s=d(t);s["content-type"]="application/json";const a=JSON.stringify({hasApp:o,name:e});let l=c.post(`${g}/directory/school`,a,s);l.status!==201&&(console.error(l.body),i.fail(`Could not create structure ${e}`)),r=h(e,t)}return r}function M(e,o,t){let r=h(e,t);if(r)console.log("School already exists");else{const s=new $.FormData;s.append("type","CSV"),s.append("structureName",e);let a,l,u;"teachers"in o?(a=o.teachers,l=o.students,u=o.responsables):a=o,s.append("Teacher",c.file(a,"enseignants.csv")),l&&s.append("Student",c.file(l,"eleves.csv")),u&&s.append("Relative",c.file(u,"responsables.csv"));const f=d(t);f["Content-Type"]="multipart/form-data; boundary="+s.boundary;const p={headers:f};c.post(`${g}/directory/wizard/import`,s.body(),p).status!=200&&i.fail(`Could not create structure ${e}`),r=h(e,t)}return r}function K(e,o,t){let r;if((o.parents||[]).map(a=>a.id).indexOf(e.id)>=0)console.log(`${o.name} is already a child of ${e.name}`),r=!1;else{const a=d(t);a["content-type"]="application/json",c.put(`${g}/directory/structure/${o.id}/parent/${e.id}`,"{}").status!==200&&i.fail(`Could not attach structure ${o.name} as a child of ${e.name}`),r=!0}return r}function L(e,o,t){const r=new $.FormData;r.append("type","CSV"),r.append("structureName",e.name),r.append("structureId",e.id),r.append("structureExternalId",e.externalId);let s,a,l;"teachers"in o?(s=o.teachers,a=o.students,l=o.responsables):s=o,r.append("Teacher",c.file(s,"enseignants.csv")),a&&r.append("Student",c.file(a,"eleves.csv")),l&&r.append("Relative",c.file(l,"responsables.csv"));const u=d(t);u["Content-Type"]="multipart/form-data; boundary="+r.boundary;const f={headers:u};return c.post(`${g}/directory/wizard/import`,r.body(),f)}const w=__ENV.ROOT_URL;function O(e,o){let t=c.get(`${w}/appregistry/roles`,{headers:d(o)});return JSON.parse(t.body).filter(s=>s.name===e)[0]}function P(e,o){const t=`${e} - All - Stress Test`;let r=O(t,o);if(r)console.log(`Role ${t} already existed`);else{let s=c.get(`${w}/appregistry/applications/actions?actionType=WORKFLOW`,{headers:d(o)});i.check(s,{"get workflow actions":p=>p.status==200});const l=JSON.parse(s.body).filter(p=>p.name===e)[0].actions.map(p=>p[0]),u=d(o);u["content-type"]="application/json";const f={role:t,actions:l};s=c.post(`${w}/appregistry/role`,JSON.stringify(f),{headers:u}),console.log(s),i.check(s,{"save role ok":p=>p.status==201}),r=O(t,o)}return r}function R(e,o){let t=c.get(`${w}/appregistry/groups/roles?structureId=${e}`,{headers:d(o)});return i.check(t,{"get structure roles should be ok":r=>r.status==200}),JSON.parse(t.body)}const q=__ENV.ROOT_URL,z=["org-entcore-workspace-controllers-WorkspaceController|getDocument","org-entcore-workspace-controllers-WorkspaceController|copyDocuments","org-entcore-workspace-controllers-WorkspaceController|getDocumentProperties","org-entcore-workspace-controllers-WorkspaceController|getRevision","org-entcore-workspace-controllers-WorkspaceController|copyFolder","org-entcore-workspace-controllers-WorkspaceController|getPreview","org-entcore-workspace-controllers-WorkspaceController|copyDocument","org-entcore-workspace-controllers-WorkspaceController|getDocumentBase64","org-entcore-workspace-controllers-WorkspaceController|listRevisions","org-entcore-workspace-controllers-WorkspaceController|commentFolder","org-entcore-workspace-controllers-WorkspaceController|commentDocument","org-entcore-workspace-controllers-WorkspaceController|shareJson","org-entcore-workspace-controllers-WorkspaceController|deleteFolder","org-entcore-workspace-controllers-WorkspaceController|restoreFolder","org-entcore-workspace-controllers-WorkspaceController|removeShare","org-entcore-workspace-controllers-WorkspaceController|moveFolder","org-entcore-workspace-controllers-WorkspaceController|moveTrash","org-entcore-workspace-controllers-WorkspaceController|restoreTrash","org-entcore-workspace-controllers-WorkspaceController|bulkDelete","org-entcore-workspace-controllers-WorkspaceController|shareResource","org-entcore-workspace-controllers-WorkspaceController|deleteRevision","org-entcore-workspace-controllers-WorkspaceController|shareJsonSubmit","org-entcore-workspace-controllers-WorkspaceController|moveDocument","org-entcore-workspace-controllers-WorkspaceController|renameFolder","org-entcore-workspace-controllers-WorkspaceController|moveTrashFolder","org-entcore-workspace-controllers-WorkspaceController|deleteComment","org-entcore-workspace-controllers-WorkspaceController|getParentInfos","org-entcore-workspace-controllers-WorkspaceController|deleteDocument","org-entcore-workspace-controllers-WorkspaceController|renameDocument","org-entcore-workspace-controllers-WorkspaceController|moveDocuments","org-entcore-workspace-controllers-WorkspaceController|updateDocument"],X=["org-entcore-workspace-controllers-WorkspaceController|getDocument","org-entcore-workspace-controllers-WorkspaceController|copyDocuments","org-entcore-workspace-controllers-WorkspaceController|getDocumentProperties","org-entcore-workspace-controllers-WorkspaceController|getRevision","org-entcore-workspace-controllers-WorkspaceController|copyFolder","org-entcore-workspace-controllers-WorkspaceController|getPreview","org-entcore-workspace-controllers-WorkspaceController|copyDocument","org-entcore-workspace-controllers-WorkspaceController|getDocumentBase64","org-entcore-workspace-controllers-WorkspaceController|listRevisions","org-entcore-workspace-controllers-WorkspaceController|commentFolder","org-entcore-workspace-controllers-WorkspaceController|commentDocument"];function Y(e,o){let t=d(o);const r=new $.FormData;r.append("file",c.file(e,"file.txt")),t["Content-Type"]="multipart/form-data; boundary="+r.boundary;let s=c.post(`${q}/workspace/document`,r.body(),{headers:t});return i.check(s,{"upload doc ok":a=>a.status===201}),JSON.parse(s.body)}const Q=__ENV.ROOT_URL;function Z(e,o,t){const r=d(t);r["content-type"]="application/json";const s=JSON.stringify(o);return c.put(`${Q}/workspace/share/resource/${e}`,s,{headers:r})}const x=__ENV.ROOT_URL;function ee(e,o,t){const r=c.post(`${x}/communication/v2/group/${e}/communique/${o}`,"{}",{headers:d(t)});return r.status!==200&&(console.error(`Error while adding communication between ${e} -> ${o}`),console.error(r),i.fail(`could not add communication between ${e} -> ${o}`)),r}const C=__ENV.ROOT_URL;function oe(e,o,t){let r=W(e,o,t);if(r)console.log("Broadcast group already existed");else{console.log("Creating broadcast group");const s=d(t);s["content-type"]="application/json";let a=JSON.stringify({name:e,structureId:o.id,subType:"BroadcastGroup"}),l=c.post(`${C}/directory/group`,a,{headers:s});i.check(l,{"create broadcast group":p=>p.status===201});const u=JSON.parse(l.body).id;a=JSON.stringify({name:e,autolinkTargetAllStructs:!0,autolinkTargetStructs:[],autolinkUsersFromGroups:["Teacher"]}),l=c.put(`${C}/directory/group/${u}`,a,{headers:s}),i.check(l,{"set broadcast group for teachers":p=>p.status===200});const f=T(o,t).id;_(u,[f],t),r=W(e,o,t)}return r}function _(e,o,t){const r=d(t);r["content-type"]="application/json";for(let s of o){let a=c.post(`${C}/communication/v2/group/${s}/communique/${e}`,"{}",{headers:r});a.status!==200&&(console.error(a),i.fail(`Cannot open comm rule from ${s} to ${e}`))}}function T(e,o){return R(e.id,o).filter(r=>r.name===`Teachers from group ${e.name}.`||r.name===`Enseignants du groupe ${e.name}.`)[0]}function W(e,o,t){const r=d(t);r["content-type"]="application/json";let s=c.get(`${C}/directory/group/admin/list?translate=false&structureId=${o.id}`,{headers:r});return JSON.parse(s.body).filter(a=>a.subType==="BroadcastGroup"&&a.name===e)[0]}n.BASE_URL=v,n.Session=S,n.SessionMode=m,n.WS_MANAGER_SHARE=z,n.WS_READER_SHARE=X,n.activateUser=b,n.activateUsers=G,n.addCommRuleToGroup=_,n.addCommunicationBetweenGroups=ee,n.attachStructureAsChild=K,n.authenticateOAuth2=N,n.authenticateWeb=D,n.createAndSetRole=P,n.createBroadcastGroup=oe,n.createEmptyStructure=H,n.createStructure=M,n.getBroadcastGroup=W,n.getConnectedUserId=I,n.getHeaders=d,n.getMetricValue=J,n.getRandomUser=B,n.getRoleByName=O,n.getRolesOfStructure=R,n.getSchoolByName=h,n.getTeacherRole=T,n.getUsersOfSchool=F,n.importUsers=L,n.linkRoleToUsers=V,n.searchUser=A,n.shareFile=Z,n.switchSession=j,n.uploadFile=Y,Object.defineProperty(n,Symbol.toStringTag,{value:"Module"})});
