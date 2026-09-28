import {features,featureDefaults} from './features.mjs';
import {dayNow} from './operations-api.mjs';
const amount=(v,max=100000000)=>{if(!Number.isSafeInteger(v)||v<0||v>max)throw Error('Ungültiger Betrag.');return v};
const text=(v,max=300)=>{if(typeof v!=='string'||!v.trim()||v.length>max)throw Error('Bitte die Pflichtfelder ausfüllen.');return v.trim()};
export const balance=(s,user)=>(s.accountEntries||[]).filter(x=>x.user===user).reduce((n,x)=>n+x.amount,0);
export function calculateInventory(s,b){
 const event=s.events.find(e=>e.id===b.event);if(!event)throw Error('Veranstaltung nicht gefunden.');
 const before=s.records.find(r=>r.id===b.before&&r.kind==='stock'),after=s.records.find(r=>r.id===b.after&&r.kind==='stock');
 if(!before||!after||before.id===after.id||Date.parse(before.date)>=Date.parse(after.date))throw Error('Zwei Bestände in richtiger zeitlicher Reihenfolge wählen.');
 const day=d=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin'}).format(new Date(d));
 if(day(before.date)>event.day||day(after.date)<event.day)throw Error('Die Bestände müssen den Veranstaltungstag einschließen.');
 if((s.eventAccounts||[]).some(a=>a.event!==b.event&&Date.parse(a.beforeDate)<Date.parse(after.date)&&Date.parse(a.afterDate)>Date.parse(before.date)))throw Error('Dieser Bestandszeitraum überschneidet sich mit einer anderen Veranstaltungsabrechnung.');
 const first=JSON.parse(before.data),last=JSON.parse(after.data);
 if(first.length!==last.length||first.some(d=>!last.some(x=>x.id===d.id)))throw Error('Beide Inventuren müssen dieselben Getränke enthalten. Bitte den Inventarwechsel prüfen.');
 const items=first.map(d=>{const end=last.find(x=>x.id===d.id),startCount=amount(d.cases)*amount(d.pack,1000)+amount(d.bottles),endCount=amount(end.cases)*amount(end.pack,1000)+amount(end.bottles),consumed=startCount-endCount;
 if(consumed<0)throw Error(d.name+': Endbestand ist größer als Anfangsbestand. Nachlieferungen oder Zählfehler bitte prüfen.');
 const price=d.purchasePrice??s.drinks.find(x=>x.id===d.id)?.purchasePrice;if(price==null)throw Error(d.name+': Einkaufspreis im Inventar ergänzen.');amount(price,100000);
 return {id:d.id,name:d.name,before:startCount,after:endCount,consumed,purchasePrice:price,cost:consumed*price,priceSource:d.purchasePrice==null?'Aktueller Inventarpreis':'Preis der Anfangsinventur'};});
 const cost=items.reduce((n,i)=>n+i.cost,0);if(!Number.isSafeInteger(cost))throw Error('Beträge zu groß.');
 return {event:event.id,eventName:event.name,eventDay:event.day,before:before.id,after:after.id,beforeDate:before.date,afterDate:after.date,items,cost};
}
export function management(s,b,{active,admin,master,id,now,u}){
 const names=['saveFeatures','saveRental','saveEventAccount','closeEventAccount','confirmHelp','settleAccount','accountPayment'];if(!names.includes(b.action))return null;
 if(b.action==='saveRental'?!admin:!master)throw Error(b.action==='saveRental'?'Nur Admin oder Master.':'Nur Master darf diese Funktion nutzen.');
 if(b.action==='saveFeatures'){const f=features(s);for(const k of Object.keys(featureDefaults)){if(typeof b.features?.[k]!=='boolean')throw Error('Ungültige Funktionsauswahl.');f[k]=b.features[k]}s.features=f;}
 if(b.action==='saveRental'){
  const name=text(b.name,150),phone=text(b.phone,35),notes=String(b.notes||'');if(!/^\+?[\d\s()/.-]{6,35}$/.test(phone)||notes.length>3000)throw Error('Handynummer oder Notiz ungültig.');
  const valid=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v+'Z').toISOString().slice(0,16)===v;
  if(!valid(b.start)||!valid(b.end)||b.start>=b.end)throw Error('Gültigen Beginn und späteres Ende angeben.');
  if(!['requested','confirmed','cancelled'].includes(b.status))throw Error('Ungültiger Status.');s.rentals??=[];const prior=s.rentals.find(x=>x.id===b.id);if(b.id&&!prior)throw Error('Vermietung nicht gefunden.');
  const conflicts=s.rentals.filter(x=>x.id!==b.id&&x.status!=='cancelled'&&b.start<x.end&&b.end>x.start).map(x=>x.name);
  const events=s.events.filter(e=>e.day>=b.start.slice(0,10)&&e.day<=b.end.slice(0,10)).map(e=>e.name);
  if(b.status!=='cancelled'&&(conflicts.length||events.length)&&b.acceptConflicts!==true)throw Error('Überschneidung: '+[...conflicts,...events].join(', ')+'. Bitte bewusst bestätigen.');
  const row={id:prior?.id||id,name,phone,notes,start:b.start,end:b.end,status:b.status,updatedAt:now,by:u.displayName};if(prior)Object.assign(prior,row);else s.rentals.push(row);
 }
 if(b.action==='saveEventAccount'||b.action==='closeEventAccount'){
  s.eventAccounts??=[];const prior=s.eventAccounts.find(x=>x.event===b.event);if(prior?.closed)throw Error('Abrechnung bereits festgeschrieben.');
  if(b.action==='closeEventAccount'){if(!prior)throw Error('Bitte zuerst die Abrechnung speichern.');Object.assign(prior,{closed:true,closedAt:now,closedBy:u.displayName});}
  else{const calculation=calculateInventory(s,b),incomeDrinks=amount(b.incomeDrinks),incomeTickets=amount(b.incomeTickets),incomeOther=amount(b.incomeOther);const row={...calculation,incomeDrinks,incomeTickets,incomeOther,profit:incomeDrinks+incomeTickets+incomeOther-calculation.cost,closed:false,updatedAt:now,by:u.displayName};if(prior)Object.assign(prior,row);else s.eventAccounts.push(row);}
 }
 if(b.action==='confirmHelp'){
  const a=s.applications.find(x=>x.id===b.application&&x.status==='confirmed'),event=s.events.find(e=>e.id===a?.event);
  if(!a||!event||event.day>=dayNow())throw Error('Nur bestätigte Dienste nach dem Veranstaltungstag können gutgeschrieben werden.');
  s.accountEntries??=[];if(s.accountEntries.some(x=>x.kind==='help'&&x.user===a.user&&x.event===a.event))throw Error('Diese Person hat für diese Veranstaltung bereits eine Gutschrift.');
  s.accountEntries.push({id,kind:'help',user:a.user,event:a.event,eventName:event.name,application:a.id,hours:5,rate:1000,amount:5000,date:now,by:u.displayName});
 }
 if(b.action==='settleAccount'){
  if(!s.members.some(x=>x.userId===b.user))throw Error('Mitglied nicht gefunden.');if(!Array.isArray(b.ids)||!b.ids.length||new Set(b.ids).size!==b.ids.length)throw Error('Keine offenen Positionen.');
  const items=s.tallies.filter(x=>x.user===b.user&&!x.receipt&&!x.void&&b.ids.includes(x.id));if(items.length!==b.ids.length)throw Error('Die Drinklist wurde bereits abgerechnet oder geändert.');
  s.accountEntries??=[];const previous=balance(s,b.user),total=items.reduce((n,x)=>n+x.price,0);s.accountEntries.push({id,kind:'drinks',user:b.user,amount:-total,date:now,by:u.displayName});
  const record={id,kind:'accountReceipt',date:now,by:u.displayName,data:JSON.stringify({user:b.user,name:s.members.find(x=>x.userId===b.user).displayName,items:structuredClone(items),previous,total,balance:previous-total})};s.records.push(record);for(const t of items)t.receipt=id;
 }
 if(b.action==='accountPayment'){
  if(!s.members.some(x=>x.userId===b.user)||!['received','payout'].includes(b.kind))throw Error('Ungültiges Mitglied oder Zahlungsart.');const value=amount(b.amount);if(!value)throw Error('Betrag muss positiv sein.');const current=balance(s,b.user);
  if(b.kind==='received'&&(current>=0||value>-current)||b.kind==='payout'&&(current<=0||value>current))throw Error('Zahlung darf den gebuchten Kontosaldo nicht überschreiten. Bitte offene Drinklist zuerst abrechnen.');
  s.accountEntries??=[];s.accountEntries.push({id,user:b.user,kind:b.kind,amount:b.kind==='received'?value:-value,date:now,by:u.displayName});
 }
 return {ok:true};
}
