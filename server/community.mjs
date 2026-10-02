export function rentalView(s,active,admin,guest){return (s.rentals||[]).filter(r=>!guest||r.requestedBy===active).map(r=>admin?r:{id:r.id,start:r.start,end:r.end,status:r.status,name:r.requestedBy===active?'Meine Anfrage':r.status==='confirmed'?'Vermietung':'Terminanfrage',notes:r.requestedBy===active?r.notes:'',own:r.requestedBy===active});}
export function infoView(s,role){return (s.infos||[]).filter(i=>['admin','master'].includes(role)||role==='crew'&&['crew','both'].includes(i.audience)||role==='member'&&['member','both'].includes(i.audience));}
export function community(s,b,{active,admin,u,id,now}){
 if(!['requestRental','saveInfo','deleteInfo'].includes(b.action))return null;
 if(b.action==='requestRental'){
  const day=b.day,note=String(b.note||'').trim();if(typeof day!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(day)||!Number.isFinite(Date.parse(day))||new Date(day+'T12:00:00Z').toISOString().slice(0,10)!==day)throw Error('Bitte ein gültiges Datum wählen.');
  const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin'}).format(new Date());if(day<today)throw Error('Bitte heute oder ein zukünftiges Datum wählen.');if(!note||note.length>3000)throw Error('Bitte eine Notiz mit 1 bis 3.000 Zeichen eingeben.');
  s.rentals??=[];if(s.rentals.some(r=>r.requestedBy===active&&r.start.slice(0,10)===day&&r.status!=='cancelled'))throw Error('Für diesen Tag liegt bereits eine Anfrage von dir vor.');
  const phone=String(b.phone||'').trim();if(phone&&!/^\+?[0-9 ()/.-]{6,35}$/.test(phone))throw Error('Bitte gültige Handynummer eingeben.');s.rentals.push({id,name:u.displayName,phone,notes:note,start:day+'T00:00',end:day+'T23:59',status:'requested',requestedBy:active,requestedAt:now,by:u.displayName,dateOnly:true});return {ok:true};
 }
 if(!admin)throw Error('Nur Admin oder Master darf Infos verwalten.');s.infos??=[];
 if(b.action==='deleteInfo'){if(!s.infos.some(i=>i.id===b.id))throw Error('Info nicht gefunden.');s.infos=s.infos.filter(i=>i.id!==b.id);return {ok:true};}
 const title=String(b.title||'').trim(),text=String(b.text||'').trim();if(!title||title.length>150||!text||text.length>5000||!['crew','member','both'].includes(b.audience))throw Error('Titel, Text und Zielgruppe prüfen.');const prior=s.infos.find(i=>i.id===b.id);if(b.id&&!prior)throw Error('Info nicht gefunden.');const row={id:prior?.id||id,title,text,audience:b.audience,updatedAt:now,by:u.displayName};if(prior)Object.assign(prior,row);else s.infos.unshift(row);return {ok:true};
}
