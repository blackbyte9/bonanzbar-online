import {randomBytes,createHash} from 'node:crypto';
import {run} from '../server/domain.mjs';
import {sb,read,commit,user,origin,body,json,failure} from '../server/platform.mjs';
async function authMember(email){for(let page=1;page<100;page++){const x=await sb(`/auth/v1/admin/users?page=${page}&per_page=100`);const found=x.users.find(u=>u.email?.toLowerCase()===email);if(found)return found;if(x.users.length<100)break}try{return await sb('/auth/v1/admin/users',{method:'POST',body:JSON.stringify({email,password:randomBytes(40).toString('base64url'),email_confirm:true})})}catch(e){throw Error('Mitglied konnte nicht angelegt werden. Bitte erneut versuchen.')}}
export default async function handler(req,res){try{if(!['GET','POST'].includes(req.method))return json(res,405,{error:'Methode nicht erlaubt'});if(req.method==='POST')origin(req);const u=await user(req,res);let command=req.method==='POST'?body(req):null;
if(command&&(!/^[a-zA-Z0-9-]{16,100}$/.test(command.requestId||'')))throw Error('Anfragekennung fehlt.');
const fingerprint=command?createHash('sha256').update(JSON.stringify(command)).digest('hex'):'';
let provisioned;
for(let attempt=0;attempt<8;attempt++){const {state,revision}=await read();if(!state.members.some(x=>x.userId===u.id))throw Error('Kein Mitgliedskonto.');if(!command){const out=await run(state,u.id);return json(res,200,out.body)}
if(['settle','allocate','receipt','assignRole','resolveCorrection','resetAll','ledgerAdd','ledgerDelete','ledgerClose'].includes(command.action)&&state.roles[u.id]!=='master')throw Error('Nur Master darf diese Funktion nutzen.');if(['saveMember','saveBand','saveSpecial','disableSpecial','eventVideo','saveStaffing','saveRecap','deleteRecap','drink','archiveDrink','order','done','syncEvents','decideApplication'].includes(command.action)&&!['admin','master'].includes(state.roles[u.id]))throw Error('Nur Admin oder Master.');
const key=u.id+':'+command.requestId,previous=state.requests?.[key];if(previous){if(previous.fingerprint!==fingerprint)throw Error('Anfragekennung wurde bereits verwendet.');return json(res,200,previous.result)}
let c={...command};delete c.authId;
if(c.action==='saveMember'){if(!['admin','master'].includes(state.roles[u.id]))throw Error('Nur Admin oder Master darf Mitglieder verwalten.');if(c.id){const member=state.members.find(x=>x.userId===c.id);if(member&&member.email!==String(c.email).trim().toLowerCase())throw Error('E-Mail-Änderungen müssen durch die technische Betreuung in Supabase und der Mitgliedsliste gemeinsam erfolgen.')}else{
// Validate every field and role before provisioning an Auth identity.
await run(state,u.id,{...c,authId:'validation-'+c.requestId});provisioned??=await authMember(String(c.email).trim().toLowerCase());c.authId=provisioned.id;}}
const out=await run(state,u.id,c);out.state.requests??=state.requests||{};out.state.requests[key]={fingerprint,result:out.body};if(Buffer.byteLength(JSON.stringify(out.state),'utf8')>3500000)throw Error('Der gemeinsame Datenspeicher dieser Version ist voll. Bitte Fotos reduzieren oder die technische Betreuung kontaktieren.');if(await commit(revision,out.state))return json(res,200,out.body)}
throw Error('Viele gleichzeitige Änderungen. Bitte erneut versuchen.');}catch(e){failure(res,e)}}
