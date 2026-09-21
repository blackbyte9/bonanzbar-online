import {sb,read,user,origin,body,cookies,json,failure,limit,config} from '../server/platform.mjs';
export default async function handler(req,res){try{
if(req.method==='GET'){const u=await user(req,res),{state}=await read();const m=state.members.find(x=>x.userId===u.id);if(!m)throw Error('Kein freigeschaltetes Mitgliedskonto.');return json(res,200,{member:m})}
if(req.method!=='POST')return json(res,405,{error:'Methode nicht erlaubt'});origin(req);const b=body(req);
if(b.action==='login'){await limit(req,'login','',20);const s=await sb('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email:String(b.email||'').trim().toLowerCase(),password:b.password})});const {state}=await read();if(!state.members.some(x=>x.userId===s.user.id))throw Error('Kein freigeschaltetes Mitgliedskonto.');cookies(res,s);return json(res,200,{ok:true})}
if(b.action==='recover'){await limit(req,'recover','',5);await sb('/auth/v1/recover',{method:'POST',body:JSON.stringify({email:String(b.email||'').trim().toLowerCase(),redirect_to:config().origin})});return json(res,200,{ok:true})}
if(b.action==='verify'){await limit(req,'verify','',20);if(typeof b.token!=='string'||b.token.length>1000)throw Error('Ungültiger Link.');const s=await sb('/auth/v1/verify',{method:'POST',body:JSON.stringify({token_hash:b.token,type:'recovery'})});const {state}=await read();if(!state.members.some(x=>x.userId===s.user.id))throw Error('Kein Mitgliedskonto.');cookies(res,s);return json(res,200,{ok:true})}
if(b.action==='logout'){try{await user(req,res);await sb('/auth/v1/logout?scope=local',{method:'POST',headers:{Authorization:'Bearer '+req.authToken}})}finally{cookies(res,null)}return json(res,200,{ok:true})}
if(b.action==='password'){await user(req,res);if(typeof b.password!=='string'||b.password.length<12||b.password.length>128)throw Error('Bitte 12 bis 128 Zeichen verwenden.');
const token=req.authToken;await sb('/auth/v1/user',{method:'PUT',headers:{Authorization:'Bearer '+token},body:JSON.stringify({password:b.password})});return json(res,200,{ok:true})}
throw Error('Unbekannte Aktion.');}catch(e){failure(res,e)}}
