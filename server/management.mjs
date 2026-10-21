export const dutyDefaults={Theke:4000,Parkplatz:1000,Ton:4000,Licht:4000,Eintritt:2000,Joker:0};
export const dutyPrices=s=>({...dutyDefaults,...s.dutyPrices});
import {features,featureDefaults} from './features.mjs';
import {dayNow} from './operations-api.mjs';
const amount=(v,max=100000000)=>{if(!Number.isSafeInteger(v)||v<0||v>max)throw Error('Ungültiger Betrag.');return v};
const text=(v,max=300)=>{if(typeof v!=='string'||!v.trim()||v.length>max)throw Error('Bitte die Pflichtfelder ausfüllen.');return v.trim()};
export const balance=(s,user)=>(s.accountEntries||[]).filter(x=>x.user===user).reduce((n,x)=>n+x.amount,0);
function selectedOrders(s,b,before,after,allowEarlier=false){
 const ids=Array.isArray(b.orders)?b.orders:[];if(new Set(ids).size!==ids.length)throw Error('Bestellung doppelt ausgewählt.');
 return ids.map(orderId=>{const order=s.records.find(r=>r.id===orderId&&r.kind==='order');if(!order)throw Error('Bestellung nicht gefunden.');if(!Number.isFinite(Date.parse(order.date))||(!allowEarlier&&Date.parse(order.date)<=Date.parse(before.date))||Date.parse(order.date)>Date.parse(after.date))throw Error('Ausgewählte Bestellungen müssen spätestens zur Endinventur angelegt worden sein und im gewählten Zeitraum geliefert worden sein.');return order});
}
function inventoryPeriod(s,b,{eventRequired=true}={}){
 const event=eventRequired?s.events.find(e=>e.id===b.event):null;if(eventRequired&&!event)throw Error('Veranstaltung nicht gefunden.');
 const before=s.records.find(r=>r.id===b.before&&r.kind==='stock'),after=s.records.find(r=>r.id===b.after&&r.kind==='stock');
 if(!before||!after||before.id===after.id||Date.parse(before.date)>=Date.parse(after.date))throw Error('Zwei Bestände in richtiger zeitlicher Reihenfolge wählen.');
 const day=d=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin'}).format(new Date(d));
 if(eventRequired&&(day(before.date)>event.day||day(after.date)<event.day))throw Error('Die Bestände müssen den Veranstaltungstag einschließen.');
 if(eventRequired&&(s.eventAccounts||[]).some(a=>a.event!==b.event&&Date.parse(a.beforeDate)<Date.parse(after.date)&&Date.parse(a.afterDate)>Date.parse(before.date)))throw Error('Dieser Bestandszeitraum überschneidet sich mit einer anderen Veranstaltungsabrechnung.');
 const first=JSON.parse(before.data).filter(d=>!d.supply),last=JSON.parse(after.data).filter(d=>!d.supply);
 if(first.length!==last.length||first.some(d=>!last.some(x=>x.id===d.id)))throw Error('Beide Inventuren müssen dieselben Getränke enthalten. Bitte den Inventarwechsel prüfen.');
 const orders=selectedOrders(s,b,before,after,!eventRequired),deliveries=new Map();for(const order of orders)for(const row of JSON.parse(order.data)){const count=amount(row.cases)*amount(row.pack,1000)+amount(row.bottles);if(count){if(!first.some(d=>d.id===row.id))throw Error(row.name+': Gelieferter Artikel fehlt in den Beständen. Bitte die Bestandslisten prüfen.');deliveries.set(row.id,(deliveries.get(row.id)||0)+count)}}
 const items=first.map(d=>{const end=last.find(x=>x.id===d.id),startCount=amount(d.cases)*amount(d.pack,1000)+amount(d.bottles)+amount(d.restMl??0,700)/700,endCount=amount(end.cases)*amount(end.pack,1000)+amount(end.bottles)+amount(end.restMl??0,700)/700,delivered=deliveries.get(d.id)||0,consumed=Math.round((startCount+delivered-endCount)*700)/700;
 if(eventRequired&&consumed<0)throw Error(d.name+': Endbestand ist trotz ausgewählter Lieferungen größer als Anfangsbestand. Bitte weitere Bestellung auswählen oder Zählung prüfen.');
 const current=s.drinks.find(x=>x.id===d.id)?.purchasePrice;const fromCurrent=d.purchasePrice==null||(d.purchasePrice===0&&current>0);const price=fromCurrent?current:d.purchasePrice;if(price==null)throw Error(d.name+': Einkaufspreis im Inventar ergänzen.');amount(price,100000);if(consumed>0&&price===0)throw Error(d.name+': Einkaufspreis ist 0. Bitte im Inventar ergänzen, damit der Verbrauch nicht kostenlos abgerechnet wird.');
 return {id:d.id,name:d.name,before:startCount,delivered,after:endCount,consumed,purchasePrice:price,cost:Math.round(consumed*price),priceSource:fromCurrent?'Aktueller Inventarpreis (fehlender/0-EK ergänzt)':'Preis der Anfangsinventur'};});
 const cost=items.reduce((n,i)=>n+i.cost,0);if(!Number.isSafeInteger(cost))throw Error('Beträge zu groß.');
 return {event:event?.id||null,eventName:event?.name||null,eventDay:event?.day||null,before:before.id,after:after.id,beforeDate:before.date,afterDate:after.date,orders:orders.map(o=>o.id),orderDetails:orders.map(o=>({id:o.id,date:o.date,by:o.by})),items,cost};
}
export function calculateInventory(s,b){return inventoryPeriod(s,b,{eventRequired:true})}
export function interimTallyCounts(tallies,beforeDate,afterDate){
 const counts=new Map(),seen=new Set();
 for(const t of tallies||[]){const date=Date.parse(t.date);if(!t.drink||t.void||t.kind==='allocation'||seen.has(t.id)||!(date>Date.parse(beforeDate)&&date<=Date.parse(afterDate)))continue;seen.add(t.id);counts.set(t.drink,(counts.get(t.drink)||0)+1)}
 return counts;
}
export function calculateInterim(s,b){
 const calculation=inventoryPeriod(s,b,{eventRequired:false}),counts=interimTallyCounts(s.tallies,calculation.beforeDate,calculation.afterDate),units={};
 const missing=[...counts.keys()].filter(id=>!calculation.items.some(i=>i.id===id));if(missing.length)throw Error('Drinklist-Artikel fehlen in den Inventuren: '+missing.map(id=>s.drinks.find(d=>d.id===id)?.name||id).join(', ')+'. Bitte die Bestände prüfen.');
 const items=calculation.items.map(i=>{
  const count=counts.get(i.id)||0,drink=s.drinks.find(d=>d.id===i.id),partial=drink?.partialBottle||!Number.isInteger(i.before)||!Number.isInteger(i.after);
  const unit=b.tallyUnits?.[i.id]??(partial&&count?null:1);
  if(typeof unit!=='number'||!Number.isFinite(unit)||unit<=0||unit>1000)throw Error(i.name+': Bitte die Menge pro Drinklist-Strich angeben.');
  units[i.id]=unit;const tallyQuantity=Number((count*unit).toFixed(6)),expectedAfter=Number((i.before+i.delivered-tallyQuantity).toFixed(6)),variance=Number((i.after-expectedAfter).toFixed(6));
  return {...i,available:i.before+i.delivered,tallyCount:count,tallyUnitsPerMark:unit,tallyQuantity,expectedAfter,variance,tallyCost:Math.round(tallyQuantity*i.purchasePrice),varianceValue:Math.round(variance*i.purchasePrice)};
 });
 return {...calculation,items,reconciliationVersion:1,tallyUnits:units,deliveryConfirmedWithinPeriod:true,tallyCount:items.reduce((n,i)=>n+i.tallyCount,0),tallyCost:items.reduce((n,i)=>n+i.tallyCost,0),varianceValue:items.reduce((n,i)=>n+i.varianceValue,0)};
}
export function management(s,b,{active,admin,master,id,now,u}){
 const names=['saveDutyPrices','accountAdjustment','saveFeatures','saveRental','saveEventAccount','closeEventAccount','saveInterimAccount','closeInterimAccount','confirmHelp','settleAccount','accountPayment'];if(!names.includes(b.action))return null;
 if(b.action==='saveRental'?!admin:!master)throw Error(b.action==='saveRental'?'Nur Admin oder Master.':'Nur Master darf diese Funktion nutzen.');
 if(b.action==='saveDutyPrices'){const prices={};for(const duty of Object.keys(dutyDefaults))prices[duty]=amount(b.prices?.[duty],100000);s.dutyPrices=prices;}
 if(b.action==='accountAdjustment'){if(!s.members.some(x=>x.userId===b.user)||!['credit','debit'].includes(b.kind))throw Error('Ungültige Buchung.');const value=amount(b.amount),reason=text(b.reason,500);if(!value)throw Error('Betrag muss positiv sein.');s.accountEntries??=[];if(!s.accountEntries.some(x=>x.id===id))s.accountEntries.push({id,user:b.user,kind:'adjustment',amount:b.kind==='credit'?value:-value,reason,date:now,by:u.displayName});}
 if(b.action==='saveFeatures'){const f=features(s);for(const k of Object.keys(featureDefaults)){if(typeof b.features?.[k]!=='boolean')throw Error('Ungültige Funktionsauswahl.');f[k]=b.features[k]}s.features=f;}
 if(b.action==='saveRental'){
  const name=text(b.name,150),phone=String(b.phone||'').trim(),notes=String(b.notes||'');if((phone&&!/^\+?[\d\s()/.-]{6,35}$/.test(phone))||notes.length>3000)throw Error('Handynummer oder Notiz ungültig.');
  const valid=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v+'Z').toISOString().slice(0,16)===v;
  if(!valid(b.start)||!valid(b.end)||b.start>=b.end)throw Error('Gültigen Beginn und späteres Ende angeben.');
  if(!['requested','confirmed','cancelled'].includes(b.status))throw Error('Ungültiger Status.');s.rentals??=[];const prior=s.rentals.find(x=>x.id===b.id);if(b.id&&!prior)throw Error('Vermietung nicht gefunden.');
  const conflicts=s.rentals.filter(x=>x.id!==b.id&&x.status!=='cancelled'&&b.start<x.end&&b.end>x.start).map(x=>x.name);
  const events=s.events.filter(e=>e.day>=b.start.slice(0,10)&&e.day<=b.end.slice(0,10)).map(e=>e.name);
  if(b.status!=='cancelled'&&(conflicts.length||events.length)&&b.acceptConflicts!==true)throw Error('Überschneidung: '+[...conflicts,...events].join(', ')+'. Bitte bewusst bestätigen.');
  const row={id:prior?.id||id,name,phone,notes,start:b.start,end:b.end,status:b.status,dateOnly:false,updatedAt:now,by:u.displayName};if(prior)Object.assign(prior,row);else s.rentals.push(row);
 }
 if(b.action==='saveEventAccount'||b.action==='closeEventAccount'){
  s.eventAccounts??=[];const prior=s.eventAccounts.find(x=>x.event===b.event);if(prior?.closed)throw Error('Abrechnung bereits festgeschrieben.');
  if(b.action==='closeEventAccount'){if(!prior)throw Error('Bitte zuerst die Abrechnung speichern.');Object.assign(prior,{closed:true,closedAt:now,closedBy:u.displayName});}
  else{const calculation=calculateInventory(s,b),incomeDrinks=amount(b.incomeDrinks),incomeTickets=amount(b.incomeTickets),incomeOther=amount(b.incomeOther),otherCosts=amount(b.otherCosts??0);const row={...calculation,incomeDrinks,incomeTickets,incomeOther,otherCosts,profit:incomeDrinks+incomeTickets+incomeOther-calculation.cost-otherCosts,closed:false,updatedAt:now,by:u.displayName};if(prior)Object.assign(prior,row);else s.eventAccounts.push(row);}
 }
 if(b.action==='saveInterimAccount'||b.action==='closeInterimAccount'){
  s.interimAccounts??=[];const prior=s.interimAccounts.find(x=>x.id===b.id);
  if(prior?.closed)throw Error('Zwischenabrechnung bereits festgeschrieben.');
  if(b.action==='closeInterimAccount'){
   if(!prior)throw Error('Zwischenabrechnung nicht gefunden.');
   const fresh=calculateInterim(s,prior);
   if(!prior.reconciliationVersion||JSON.stringify(fresh.items)!==JSON.stringify(prior.items)||JSON.stringify(fresh.orderDetails)!==JSON.stringify(prior.orderDetails))throw Error('Bestand oder Drinklist hat sich geändert. Bitte den Entwurf bearbeiten, neu berechnen und speichern.');
   Object.assign(prior,{closed:true,closedAt:now,closedBy:u.displayName});
  }
  else{const title=text(b.title,150),calculation=calculateInterim(s,b),otherCosts=amount(b.otherCosts??0);const row={...calculation,id:b.id||id,title,otherCosts,totalCost:calculation.cost+otherCosts,closed:false,updatedAt:now,by:u.displayName};if(prior)Object.assign(prior,row);else s.interimAccounts.push(row);}
 }
 if(b.action==='confirmHelp'){
  const a=s.applications.find(x=>x.id===b.application&&x.status==='confirmed'),event=s.events.find(e=>e.id===a?.event);
  if(!a||!event||event.day>=dayNow())throw Error('Nur bestätigte Dienste nach dem Veranstaltungstag können gutgeschrieben werden.');
  s.accountEntries??=[];if(s.accountEntries.some(x=>x.kind==='help'&&x.user===a.user&&x.event===a.event))throw Error('Diese Person hat für diese Veranstaltung bereits eine Gutschrift.');
  s.accountEntries.push({id,kind:'help',user:a.user,event:a.event,eventName:event.name,application:a.id,hours:5,duty:a.duty,amount:dutyPrices(s)[a.duty]??0,date:now,by:u.displayName});
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
