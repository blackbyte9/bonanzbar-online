import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {calculateInterim,interimTallyCounts} from '../server/management.mjs';
import {csvCell} from '../server/csv-format.mjs';
import {OrderPicker,records} from './management';

const qty=(n:number)=>n.toLocaleString('de-DE',{maximumFractionDigits:4});
const money=(n:number)=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(n/100);
const stamp=(d:string)=>new Date(d).toLocaleString('de-DE',{timeZone:'Europe/Berlin'});
const cents=(v:string)=>Math.round(Number(v.replace(',','.'))*100);

function exportInterim(a:any){
 const rows=[['Zwischenabrechnung',a.title],['Status',a.closed?'Abgeschlossen':'Entwurf'],['Anfangsbestand',stamp(a.beforeDate)],['Endbestand',stamp(a.afterDate)],
  ['Formel','Soll-Endbestand = Anfang + erhaltene Lieferungen - Drinklist-Verbrauch'],
  ['Abweichung','Ist-Endbestand - Soll-Endbestand; negativ = Fehlbestand, positiv = Mehrbestand'],
  ['Ausgewählte, im Zeitraum erhaltene Bestellungen',...(a.orderDetails||[]).map((o:any)=>stamp(o.date)+' · '+o.by)],
  ['Getränk','Anfang','Lieferung','Verfügbar','Striche','Einheiten pro Strich','Drinklist-Verbrauch','Soll-Endbestand','Ist-Endbestand','Abweichung Ist minus Soll','Verbrauch tatsächlich','EK EUR','Drinklist EK EUR','Verbrauchskosten EUR'],
  ...a.items.map((i:any)=>[i.name,i.before,i.delivered||0,i.available??i.before+(i.delivered||0),i.tallyCount??'',i.tallyUnitsPerMark??'',i.tallyQuantity??'',i.expectedAfter??'',i.after,i.variance??'',i.consumed,i.purchasePrice/100,i.tallyCost==null?'':i.tallyCost/100,i.cost/100]),
  ['Drinklist-Verbrauch zum EK',a.tallyCost==null?'':a.tallyCost/100],['Verbrauchskosten gesamt',a.cost/100],['Sonstige Kosten',(a.otherCosts||0)/100],['Kosten gesamt',(a.totalCost??a.cost+(a.otherCosts||0))/100]];
 const url=URL.createObjectURL(new Blob(['\ufeff'+rows.map(r=>r.map(csvCell).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'}));
 const link=document.createElement('a');link.href=url;link.download='Zwischenabrechnung-'+a.beforeDate.slice(0,10)+'-'+a.afterDate.slice(0,10)+'.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

function Reconciliation({calculation:a,otherCosts=0}:any){return <div className="interim-result">
 <div className="metric-grid"><div>Verbrauch gesamt zum EK<strong>{money(a.cost)}</strong></div><div>Davon Drinklist zum EK<strong>{a.tallyCost==null?'Nicht ermittelt':money(a.tallyCost)}</strong></div><div>Sonstige Kosten<strong>{money(otherCosts)}</strong></div><div>Kosten gesamt<strong>{money(a.cost+otherCosts)}</strong></div></div>
 <p>Der Drinklist-Anteil ist bereits in den Verbrauchskosten enthalten. Er wird nicht nochmals als Ausgabe addiert. Alle Mengen beziehen sich auf einzelne Flaschen bzw. Bestandseinheiten, nicht auf Gebinde.</p>
 {a.reconciliationVersion&&<p><strong>{a.tallyCount} gültige Drinklist-Striche</strong> im Zeitraum; bereits abgerechnete Striche zählen mit. Stornierte Striche und Kostenumlagen zählen nicht.</p>}
 {a.items.map((i:any)=><article className="reconcile-item" key={i.id}>
  <h4>{i.name}</h4>
  <p className="reconcile-formula">{qty(i.before)} Anfang + {qty(i.delivered||0)} Lieferung = <strong>{qty(i.available??i.before+(i.delivered||0))} verfügbar</strong></p>
  {i.expectedAfter!=null?<>
   <p>− {qty(i.tallyQuantity)} Drinklist-Verbrauch ({i.tallyCount} Striche × {qty(i.tallyUnitsPerMark)} Einheiten)</p>
   <div className="metric-grid"><div>Soll-Endbestand<strong>{qty(i.expectedAfter)}</strong></div><div>Gezählt · Ist-Endbestand<strong>{qty(i.after)}</strong></div></div>
   <p className={'reconcile-difference '+(Math.abs(i.variance)<0.00001?'matched':'different')}><strong>{Math.abs(i.variance)<0.00001?'✓ Bestand stimmt mit der Drinklist überein':i.variance<0?`${qty(-i.variance)} Fehlbestand gegenüber Soll`:`${qty(i.variance)} Mehrbestand gegenüber Soll`}</strong></p>
   {i.expectedAfter<0&&<p className="notice">Der Sollbestand ist negativ. Bitte Lieferungen, Zählung und Menge je Strich prüfen.</p>}
  </>:<p className="notice">Diese ältere Abrechnung enthält noch keinen Drinklist-Abgleich.</p>}
  <small>Tatsächlicher Bestandsverbrauch: {qty(i.consumed)} · {money(i.cost)} zum Einkaufspreis {money(i.purchasePrice)} pro Einheit.</small>
  {i.consumed<0&&<p className="notice">Bestandszuwachs über die ausgewählten Lieferungen hinaus. Bitte fehlende Lieferung oder Zählung prüfen; der Zuwachs wird als negativer Verbrauch ausgewiesen.</p>}
 </article>)}
 </div>}

export function InterimAccounts({data,act,busy,confirm}:any){
 const [id,setId]=useState(()=>crypto.randomUUID()),[editing,setEditing]=useState(false),[title,setTitle]=useState(''),[before,setBefore]=useState(''),[after,setAfter]=useState(''),[orders,setOrders]=useState<string[]>([]),[otherCosts,setOtherCosts]=useState('0'),[tallyUnits,setTallyUnits]=useState<Record<string,number|null>>({});
 const start=data.stock.find((r:any)=>r.id===before),end=data.stock.find((r:any)=>r.id===after);
 const drinks=data.inventoryDrinks||data.drinks;
 const counts=interimTallyCounts(data.inventoryTallies||[],start?.date,end?.date);
 const stockItems=start?JSON.parse(start.data).filter((i:any)=>!i.supply):[];
 let calculation:any=null,error='';
 try{if(start&&end){if(!data.inventoryTallies)throw Error('Drinklist-Verlauf wird benötigt. Bitte die App neu laden.');calculation=calculateInterim({records:records(data),drinks,tallies:data.inventoryTallies},{before,after,orders,tallyUnits})}}catch(e){error=(e as Error).message}
 function clear(){setId(crypto.randomUUID());setEditing(false);setTitle('');setBefore('');setAfter('');setOrders([]);setOtherCosts('0');setTallyUnits({})}
 function edit(a:any){setId(a.id);setEditing(true);setTitle(a.title);setBefore(a.before);setAfter(a.after);setOrders(a.orders||[]);setOtherCosts(String((a.otherCosts||0)/100));setTallyUnits(a.tallyUnits||{});document.getElementById('interim-heading')?.scrollIntoView({behavior:'smooth',block:'start'})}
 return <section className="panel"><h2 id="interim-heading">Zwischenabrechnung · Soll & Ist</h2>
  <p><strong>Anfangsbestand + erhaltene Lieferungen − Drinklist-Verbrauch = Soll-Endbestand.</strong> Vergleiche diesen Sollbestand mit der gezählten Endinventur. Der Endbestand darf durch eine Lieferung höher sein als der Anfangsbestand.</p>
  <form className="event-form" onSubmit={async e=>{e.preventDefault();if(await act('saveInterimAccount',{id,title,before,after,orders,tallyUnits,otherCosts:cents(otherCosts)}))clear()}}>
   <fieldset disabled={busy}>
   <legend>{editing?'Gespeicherten Entwurf aktualisieren':'Neue Zwischenabrechnung'}</legend>
   <label>Bezeichnung<Input required maxLength={150} value={title} onChange={e=>setTitle(e.target.value)} placeholder="Zum Beispiel: Zwischen zwei Konzerten"/></label>
   <div className="form-grid">{[['Anfangsbestand',before,setBefore],['Gezählter Endbestand',after,setAfter]].map(([label,value,setter]:any)=><label key={label}>{label}<select required value={value} onChange={e=>{setter(e.target.value);setOrders([]);setTallyUnits({})}}><option value="">Inventur wählen</option>{data.stock.map((r:any)=><option key={r.id} value={r.id}>{stamp(r.date)} · {r.by}{r.correctedAt?' · korrigiert':''}</option>)}</select></label>)}</div>
   <OrderPicker {...{data,before,after,value:orders,setValue:setOrders,disabled:busy,allowEarlier:true}}/>
   {!!counts.size&&<fieldset><legend>Verbrauch je Drinklist-Strich prüfen</legend><p>Bei Flaschengetränken ist 1 Strich = 1 Flasche voreingestellt. Für angebrochene 0,7-l-Flaschen die ausgeschenkte Menge in ml eingeben (z. B. 20 ml = 2 cl). Die Einstellung gilt für diese Abrechnung. Bei Wein oder anderen Ausschankgrößen den entsprechenden Flaschenanteil eintragen.</p>
    {stockItems.filter((i:any)=>counts.has(i.id)).map((i:any)=>{const partial=drinks.find((d:any)=>d.id===i.id)?.partialBottle||i.restMl>0||JSON.parse(end?.data||'[]').find((d:any)=>d.id===i.id)?.restMl>0;const unit=tallyUnits[i.id]??(partial?null:1);return <label key={i.id}>{i.name} · {counts.get(i.id)} Striche · {partial?'ml pro Strich (Flasche: 700 ml)':'Flaschen / Einheiten pro Strich'}<Input required type="number" min={partial?'1':'0.000001'} max={partial?'700':'1000'} step="any" value={unit==null?'':partial?Number((unit*700).toFixed(6)):unit} placeholder={partial?'Ausschankmenge in ml':''} onChange={e=>setTallyUnits({...tallyUnits,[i.id]:e.target.value===''?null:Number(e.target.value)/(partial?700:1)})}/></label>})}
   </fieldset>}
   <label>Sonstige Kosten (€)<Input required type="number" min="0" max="1000000" step="0.01" value={otherCosts} onChange={e=>setOtherCosts(e.target.value)}/></label>
   {error&&<p className="notice" role="alert">{error}</p>}
   {calculation&&<Reconciliation calculation={calculation} otherCosts={cents(otherCosts)}/>}
   <div className="actions"><Button disabled={!calculation||!title.trim()}>{editing?'Entwurf neu berechnen und speichern':'Zwischenabrechnung speichern'}</Button>{editing&&<Button type="button" variant="outline" onClick={clear}>Bearbeitung abbrechen</Button>}</div>
   </fieldset>
  </form>
  <h3>Gespeicherte Zwischenabrechnungen</h3>
  {(data.interimAccounts||[]).slice().reverse().map((a:any)=><details className="archive" key={a.id}><summary>{a.title} · {stamp(a.beforeDate)} bis {stamp(a.afterDate)} <span>{a.closed?'abgeschlossen':'Entwurf'}</span></summary>
   <p>Gespeicherter Stand vom {stamp(a.updatedAt)} · {a.by}</p><Reconciliation calculation={a} otherCosts={a.otherCosts||0}/>
   <div className="actions"><Button variant="outline" onClick={()=>exportInterim(a)}>CSV herunterladen</Button>{!a.closed&&<><Button variant="outline" disabled={busy} onClick={()=>edit(a)}>Bearbeiten / neu berechnen</Button><Button disabled={busy||!a.reconciliationVersion} onClick={()=>confirm({title:'Zwischenabrechnung festschreiben?',text:'Lieferungen, Drinklist-Abgleich, Ausschankmengen und Kosten werden mit diesem Stand archiviert.',run:()=>act('closeInterimAccount',{id:a.id})})}>Abschließen</Button></>}</div>
   {!a.closed&&!a.reconciliationVersion&&<p>Für den neuen Soll-Ist-Vergleich diesen Entwurf bearbeiten und erneut speichern.</p>}
  </details>)}
  {!data.interimAccounts?.length&&<p className="muted">Noch keine Zwischenabrechnung gespeichert.</p>}
 </section>
}
