import {interimExcludedIds} from './interim-drinklist.mjs';

const berlinDay=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'});
const dayMs=86400000;
const dayString=d=>d.toISOString().slice(0,10);

export function drinklistWeek(value=new Date()){
 const instant=new Date(value);
 if(!Number.isFinite(instant.getTime()))throw Error('Ungültiges Datum.');
 const local=berlinDay.format(instant),monday=new Date(local+'T12:00:00Z');
 monday.setUTCDate(monday.getUTCDate()-((monday.getUTCDay()+6)%7));
 return weekFromMonday(dayString(monday));
}

export function weekFromMonday(start){
 const monday=new Date(start+'T12:00:00Z');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(start)||!Number.isFinite(monday.getTime())||dayString(monday)!==start||monday.getUTCDay()!==1)throw Error('Ungültiger Wochenbeginn.');
 const thursday=new Date(monday.getTime()+3*dayMs),year=thursday.getUTCFullYear();
 const first=new Date(Date.UTC(year,0,4,12));first.setUTCDate(first.getUTCDate()-((first.getUTCDay()+6)%7));
 const week=1+Math.round((monday.getTime()-first.getTime())/(7*dayMs));
 return {key:year+'-W'+String(week).padStart(2,'0'),year,week,start,end:dayString(new Date(monday.getTime()+6*dayMs))};
}

export function shiftDrinklistWeek(start,steps){
 const week=weekFromMonday(start),day=new Date(week.start+'T12:00:00Z');
 day.setUTCDate(day.getUTCDate()+7*steps);
 return weekFromMonday(dayString(day));
}

export function drinklistWeeks(s){
 const weeks=new Map(),seen=new Set(),members=new Map((s.members||[]).map(m=>[m.userId,m.displayName])),drinks=new Map((s.drinks||[]).map(d=>[d.id,d.name]));
 const excluded=interimExcludedIds(s);
 for(const t of s.tallies||[]){
  if(!t.drink||t.void||t.kind==='allocation'||seen.has(t.id)||!Number.isFinite(Date.parse(t.date)))continue;
  seen.add(t.id);
  const week=drinklistWeek(t.date);
  if(!weeks.has(week.key))weeks.set(week.key,{...week,people:new Map()});
  const bucket=weeks.get(week.key),user=t.user||'unknown';
  if(!bucket.people.has(user))bucket.people.set(user,{user,name:members.get(user)||t.memberName||(user==='unknown'?'Unbekanntes Konto':'Konto '+user),drinks:new Map()});
  const person=bucket.people.get(user);
  if(!person.drinks.has(t.drink))person.drinks.set(t.drink,{drink:t.drink,name:drinks.get(t.drink)||t.name||'Unbekanntes Getränk',count:0,openCount:0,settledCount:0,excludedFromInterim:excluded.has(t.drink)});
  const row=person.drinks.get(t.drink);row.count++;if(t.receipt)row.settledCount++;else row.openCount++;
 }
 return [...weeks.values()].map(w=>weekDrinklistView({...w,people:[...w.people.values()].map(p=>({...p,drinks:[...p.drinks.values()].sort((a,b)=>a.name.localeCompare(b.name,'de')||a.drink.localeCompare(b.drink))})).sort((a,b)=>a.name.localeCompare(b.name,'de')||a.user.localeCompare(b.user))})).sort((a,b)=>b.start.localeCompare(a.start));
}

export function weekDrinklistView(week,hideSpirits=false){
 const people=(week.people||[]).map(p=>{
  const drinks=p.drinks.filter(d=>!hideSpirits||!d.excludedFromInterim);
  return {...p,drinks,count:drinks.reduce((n,d)=>n+d.count,0),openCount:drinks.reduce((n,d)=>n+d.openCount,0),settledCount:drinks.reduce((n,d)=>n+d.settledCount,0)};
 }).filter(p=>p.count>0);
 return {...week,people,count:people.reduce((n,p)=>n+p.count,0),openCount:people.reduce((n,p)=>n+p.openCount,0),settledCount:people.reduce((n,p)=>n+p.settledCount,0)};
}

export function weeklyDrinklistCsvRows(week,hideSpirits=false){
 const report=weekDrinklistView(week,hideSpirits);
 return [['Drinklist-Wochenübersicht',report.key],['Von Montag',report.start],['Bis Sonntag',report.end],['Zeitzone','Europe/Berlin'],['Getränkeauswahl',hideSpirits?'Ohne Schnaps und entsprechende Mixgetränke':'Alle Getränke inklusive Schnaps und Mixgetränke'],['Hinweis','Abgerechnet bedeutet mit dem Mitgliedskonto verrechnet, nicht zwingend bezahlt.'],['Person','Getränk / Position','Striche','Noch offen','Bereits abgerechnet'],...report.people.flatMap(p=>[[p.name,'Gesamt Person',p.count,p.openCount,p.settledCount],...p.drinks.map(d=>[p.name,d.name,d.count,d.openCount,d.settledCount])]),['Alle Personen','Gesamt Woche',report.count,report.openCount,report.settledCount]];
}
