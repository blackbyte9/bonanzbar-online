import {read,commit} from './platform.mjs';
export async function ensureMember(user){
 for(let attempt=0;attempt<8;attempt++){
  const {state,revision}=await read(),existing=state.members.find(x=>x.userId===user.id);if(existing)return existing;
  if(!user.id||!user.email||!user.email_confirmed_at)throw Error('Bitte zuerst die E-Mail-Adresse bestätigen.');
  if(state.members.some(x=>x.email.toLowerCase()===user.email.toLowerCase()))throw Error('Diese E-Mail ist bereits einem anderen Konto zugeordnet. Bitte Master kontaktieren.');
  const supplied=user.user_metadata?.display_name;
  const member={userId:user.id,email:user.email.toLowerCase(),displayName:typeof supplied==='string'&&supplied.trim()?supplied.trim().slice(0,80):user.email.split('@')[0],registeredAt:new Date().toISOString()};
  state.members.push(member);state.roles[user.id]='guest';
  if(Buffer.byteLength(JSON.stringify(state),'utf8')>3500000)throw Error('Datenspeicher voll. Bitte Master kontaktieren.');
  if(await commit(revision,state))return member;
 }
 throw Error('Registrierung gerade ausgelastet. Bitte erneut anmelden.');
}
