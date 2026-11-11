import {stockGroup} from './stock-groups.mjs';

export function interimExcludedIds(s){
 const catalog=new Map((s.drinks||[]).map(d=>[d.id,d]));
 const candidates=[...(s.drinks||[])];
 for(const r of s.records||[])if(['stock','order'].includes(r.kind))candidates.push(...JSON.parse(r.data));
 for(const t of s.tallies||[])if(t.drink)candidates.push({id:t.drink,name:t.name||''});
 return new Set(candidates.filter(row=>{
  const d={...row,...catalog.get(row.id)};
  return stockGroup(d)==='Schnaps'||/\bjack(?:y|ie|i)?\b|cuba\s*libre|mojito|caipirinha/i.test(d.name||'');
 }).map(d=>d.id));
}

export function interimDrinklist(s,beforeDate,afterDate){
 const excludedIds=interimExcludedIds(s),counts=new Map(),people=new Map(),seen=new Set();
 const members=new Map((s.members||[]).map(p=>[p.userId,p.displayName]));
 const drinks=new Map((s.drinks||[]).map(d=>[d.id,d.name]));
 for(const t of s.tallies||[]){
  const date=Date.parse(t.date);
  if(!t.drink||excludedIds.has(t.drink)||t.void||t.kind==='allocation'||seen.has(t.id)||!(date>Date.parse(beforeDate)&&date<=Date.parse(afterDate)))continue;
  seen.add(t.id);counts.set(t.drink,(counts.get(t.drink)||0)+1);
  const user=t.user||'unknown';
  if(!people.has(user))people.set(user,{user,name:members.get(user)||t.memberName||(user==='unknown'?'Unbekanntes Konto':'Konto '+user),count:0,drinks:new Map()});
  const person=people.get(user);person.count++;
  if(!person.drinks.has(t.drink))person.drinks.set(t.drink,{id:t.drink,name:drinks.get(t.drink)||t.name||'Unbekanntes Getränk',count:0});
  person.drinks.get(t.drink).count++;
 }
 return {excludedIds,counts,people:[...people.values()].map(p=>({...p,drinks:[...p.drinks.values()].sort((a,b)=>a.name.localeCompare(b.name,'de')||a.id.localeCompare(b.id))})).sort((a,b)=>a.name.localeCompare(b.name,'de')||a.user.localeCompare(b.user))};
}
