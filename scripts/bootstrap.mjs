import {randomBytes} from 'node:crypto';
import {sb} from '../server/platform.mjs';
import {initialState} from '../server/domain.mjs';
const email=process.env.MASTER_EMAIL?.trim().toLowerCase(),name=process.env.MASTER_NAME||'Master';
if(!email||!email.includes('@'))throw Error('MASTER_EMAIL in .env.local ergänzen.');
const rows=await sb('/rest/v1/app_state?id=eq.1&select=id');if(rows.length)throw Error('Bereits eingerichtet. Bestehende Daten bleiben erhalten.');
let member;for(let page=1;page<100;page++){const r=await sb(`/auth/v1/admin/users?page=${page}&per_page=100`);member=r.users.find(x=>x.email?.toLowerCase()===email);if(member||r.users.length<100)break}
member??=await sb('/auth/v1/admin/users',{method:'POST',body:JSON.stringify({email,email_confirm:true,password:randomBytes(40).toString('base64url')})});
const state=initialState();state.members=[{userId:member.id,displayName:name,email}];state.roles={[member.id]:'master'};
await sb('/rest/v1/app_state',{method:'POST',body:JSON.stringify({id:1,state})});console.log('Master eingerichtet. Passwort über „Passwort festlegen / vergessen“ in der App setzen.');
