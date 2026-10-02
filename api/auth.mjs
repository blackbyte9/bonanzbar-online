import {ensureMember} from '../server/registration.mjs';
import {sb,read,user,origin,body,cookies,json,failure,limit,config} from '../server/platform.mjs';
export default async function handler(req,res){try{
if(req.method==='GET'){const u=await user(req,res),m=await ensureMember(u);return json(res,200,{member:m})}
if(req.method!=='POST')return json(res,405,{error:'Methode nicht erlaubt'});origin(req);const b=body(req);
if(b.action==='login'){await limit(req,'login','',20);const s=await sb('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email:String(b.email||'').trim().toLowerCase(),password:b.password})});await ensureMember(s.user);cookies(res,s);return json(res,200,{ok:true})}
if(b.action==='signup'){
await limit(req,'signup','',5);const email=String(b.email||'').trim().toLowerCase(),name=String(b.name||'').trim();
if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254||!name||name.length>80||typeof b.password!=='string'||b.password.length<12||b.password.length>128)throw Error('Bitte Benutzername, gültige E-Mail und ein Passwort mit 12 bis 128 Zeichen angeben.');
const key=process.env.SUPABASE_ANON_KEY;if(!key)throw Error('Selbstregistrierung noch nicht eingerichtet. Bitte Master kontaktieren.');
const headers={apikey:key,Authorization:'Bearer '+key};const settings=await sb('/auth/v1/settings',{headers});if(settings.mailer_autoconfirm!==false)throw Error('E-Mail-Bestätigung muss vor der Registrierung eingerichtet werden.');
await sb('/auth/v1/signup?redirect_to='+encodeURIComponent(config().origin),{method:'POST',headers,body:JSON.stringify({email,password:b.password,data:{display_name:name}})});return json(res,200,{ok:true});
}
if(b.action==='resend'){await limit(req,'resend','',5);const key=process.env.SUPABASE_ANON_KEY;if(!key)throw Error('Registrierung noch nicht eingerichtet.');await sb('/auth/v1/resend?redirect_to='+encodeURIComponent(config().origin),{method:'POST',headers:{apikey:key,Authorization:'Bearer '+key},body:JSON.stringify({type:'signup',email:String(b.email||'').trim().toLowerCase()})});return json(res,200,{ok:true})}
if(b.action==='recover'){await limit(req,'recover','',5);await sb('/auth/v1/recover?redirect_to='+encodeURIComponent(config().origin),{method:'POST',body:JSON.stringify({email:String(b.email||'').trim().toLowerCase()})});return json(res,200,{ok:true})}
if(b.action==='verify'){await limit(req,'verify','',20);if(typeof b.token!=='string'||b.token.length>1000)throw Error('Ungültiger Link.');const verificationType=b.type||'recovery';if(!['recovery','email','signup'].includes(verificationType))throw Error('Ungültiger Linktyp.');const s=await sb('/auth/v1/verify',{method:'POST',body:JSON.stringify({token_hash:b.token,type:verificationType})});await ensureMember(s.user);cookies(res,s);return json(res,200,{ok:true})}
if(b.action==='logout'){try{await user(req,res);await sb('/auth/v1/logout?scope=local',{method:'POST',headers:{Authorization:'Bearer '+req.authToken}})}finally{cookies(res,null)}return json(res,200,{ok:true})}
if(b.action==='password'){await user(req,res);if(typeof b.password!=='string'||b.password.length<12||b.password.length>128)throw Error('Bitte 12 bis 128 Zeichen verwenden.');
const token=req.authToken;await sb('/auth/v1/user',{method:'PUT',headers:{Authorization:'Bearer '+token},body:JSON.stringify({password:b.password})});return json(res,200,{ok:true})}
throw Error('Unbekannte Aktion.');}catch(e){failure(res,e)}}
