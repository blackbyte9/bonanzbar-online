import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {MemberAccounts} from './management';
import {CorrectionInbox} from './corrections';
import {csvCell} from '../server/csv-format.mjs';
import {drinklistWeek,weekFromMonday,shiftDrinklistWeek,weekDrinklistView,weeklyDrinklistCsvRows} from '../server/drinklist-weeks.mjs';

const day=(v:string)=>new Date(v+'T12:00:00Z').toLocaleDateString('de-DE',{timeZone:'Europe/Berlin'});
const weekLabel=(w:any)=>`KW ${w.week}/${w.year} · ${day(w.start)} – ${day(w.end)}`;
const money=(n:number)=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(n/100);
function download(name:string,rows:any[][]){const url=URL.createObjectURL(new Blob(['\ufeff'+rows.map(r=>r.map(csvCell).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download=name+'.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}

export function WeeklyDrinklist({data}:any){
 const current=drinklistWeek(),[start,setStart]=useState(()=>current.start),[hideSpirits,setHideSpirits]=useState(false);
 if(!data.master)return null;
 const weeks=data.drinklistWeeks||[],selected=weekFromMonday(start);
 const choices=[...new Map([...weeks,current,selected].map(w=>[w.start,w])).values()].sort((a:any,b:any)=>b.start.localeCompare(a.start));
 const report=weekDrinklistView(weeks.find((w:any)=>w.start===start)||{...selected,people:[]},hideSpirits);
 return <section className="panel weekly-drinklist"><h2>Striche pro Woche und Person</h2>
  <p>Montag bis Sonntag, nach deutscher Ortszeit. Es zählt der Zeitpunkt des Getränkestrichs, auch wenn er später abgerechnet wurde. Stornierte Striche und Kostenumlagen zählen nicht.</p>
  <div className="week-navigation"><Button variant="outline" aria-label="Vorherige Woche" onClick={()=>setStart(shiftDrinklistWeek(start,-1).start)}>← Vorherige</Button><Button variant="outline" onClick={()=>setStart(current.start)}>Diese Woche</Button><Button variant="outline" aria-label="Nächste Woche" disabled={start>=current.start} onClick={()=>setStart(shiftDrinklistWeek(start,1).start)}>Nächste →</Button></div>
  <label>Kalenderwoche<select className="duty-select" value={start} onChange={e=>setStart(e.target.value)}>{choices.map((w:any)=><option key={w.start} value={w.start}>{weekLabel(w)}{w.start===current.start?' · aktuell':''}</option>)}</select></label>
  <label className="checkline"><input type="checkbox" checked={hideSpirits} onChange={e=>setHideSpirits(e.target.checked)}/><span>Schnaps und entsprechende Mixgetränke ausblenden</span></label>
  <p className="muted">{hideSpirits?'Gezählt werden die Getränke ohne Schnaps und entsprechende Mixgetränke, wie in der Zwischenabrechnung.':'Gezählt wird die gesamte Drinklist inklusive Schnaps und Mixgetränken. Der Schnaps-Ausschluss der Zwischenabrechnung gilt hier nur, wenn du ihn oben aktivierst.'}</p>
  {!data.drinklistWeeks?<p className="notice" role="alert">Die Wochenübersicht ist noch nicht geladen. Bitte die App neu laden und prüfen, ob das vollständige Update installiert ist.</p>:<>
   <h3>{weekLabel(selected)}</h3>
   <div className="metric-grid"><div>Striche insgesamt<strong>{report.count}</strong></div><div>Personen mit Strichen<strong>{report.people.length}</strong></div><div>Davon noch offen<strong>{report.openCount}</strong></div><div>Davon abgerechnet<strong>{report.settledCount}</strong></div></div>
   <p className="muted">„Abgerechnet“ heißt mit dem Mitgliedskonto verrechnet – nicht zwingend bereits bezahlt. Die Wochenansicht verändert keine Konten.</p>
   {report.people.map((p:any)=><article className="reconcile-item weekly-person" key={p.user}><div className="list-row"><h3>{p.name}</h3><strong>{p.count} {p.count===1?'Strich':'Striche'}</strong></div><p>{p.openCount} noch offen · {p.settledCount} bereits abgerechnet</p><details><summary>Getränke einzeln anzeigen</summary>{p.drinks.map((d:any)=><div className="list-row" key={d.drink}><div><strong>{d.name}</strong><small>{d.openCount} offen · {d.settledCount} abgerechnet</small></div><b>{d.count} {d.count===1?'Strich':'Striche'}</b></div>)}</details></article>)}
   {!report.people.length&&<p className="notice">In dieser Woche gibt es für diese Getränkeauswahl keine gültigen Striche.</p>}
   <Button variant="outline" onClick={()=>download('Bonanzbar-Drinklist-'+report.key,weeklyDrinklistCsvRows(report,hideSpirits))}>Diese Woche als CSV herunterladen</Button>
  </>}
 </section>
}

function LegacyDrinkReceipts({data}:any){const receipts=(data.receipts||[]).filter((r:any)=>!data.people.some((p:any)=>p.id===JSON.parse(r.data).user));if(!receipts.length)return null;return <details className="archive"><summary>Frühere Belege ohne zugeordnetes Mitgliedskonto ({receipts.length})</summary>{receipts.map((r:any)=>{const v=JSON.parse(r.data),groups=new Map();for(const t of v.items){const key=t.name+':'+t.price;if(!groups.has(key))groups.set(key,{name:t.name,price:t.price,count:0});groups.get(key).count++}return <div className="archive list-row" key={r.id}><div><strong>{v.name}</strong><small>{new Date(r.date).toLocaleString('de-DE',{timeZone:'Europe/Berlin'})} · {money(v.items.reduce((n:number,x:any)=>n+x.price,0))}</small></div><Button variant="outline" onClick={()=>download('Bonanzbar-Beleg-'+r.date.slice(0,10),[['Mitglied',v.name],['Datum',r.date],['Getränk','Anzahl','Einzelpreis EUR','Gesamt EUR'],...[...groups.values()].map(g=>[g.name,g.count,g.price/100,g.count*g.price/100]),['Gesamt','','',v.items.reduce((n:number,x:any)=>n+x.price,0)/100]])}>Beleg herunterladen</Button></div>})}</details>}

export default function DrinklistAccounting({data,act,busy,confirm,onBack}:any){
 const [section,setSection]=useState('weeks');
 if(!data.master)return null;
 const corrections=(data.corrections||[]).filter((c:any)=>c.status==='pending').length;
 return <><div className="section-head"><div><span className="eyebrow">NUR FÜR MASTER</span><h2>Drinklist-Abrechnung</h2><p>Wochenübersicht, Mitgliedskonten und Getränkebelege.</p></div></div><Button variant="outline" onClick={onBack}>← Zur Verwaltung</Button>
  <div className="drink-accounting-navigation" role="group" aria-label="Drinklist-Aufgabe wählen">{[['weeks','Wochenübersicht'],['accounts','Abrechnen & Belege'],['corrections',`Korrekturanfragen${corrections?' ('+corrections+')':''}`]].map(([id,label])=><Button key={id} variant={section===id?'default':'outline'} aria-pressed={section===id} onClick={()=>setSection(id)}>{label}</Button>)}</div>
  {section==='weeks'&&<WeeklyDrinklist data={data}/>}
  {section==='accounts'&&<><p>Helfergutschriften aus der Buchhaltung werden hier mit der Drinklist verrechnet.</p><MemberAccounts {...{data,act,busy,confirm}}/><LegacyDrinkReceipts data={data}/></>}
  {section==='corrections'&&<CorrectionInbox {...{data,act,busy,confirm}}/>}
 </>
}
