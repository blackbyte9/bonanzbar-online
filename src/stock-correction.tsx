import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';

const total=(x:any)=>Number(x.cases||0)*Number(x.pack||1)+Number(x.bottles||0)+Number(x.restMl||0)/700;
const fmt=(n:number)=>n.toLocaleString('de-DE',{maximumFractionDigits:4});

export default function StockCorrection({record,data,act,busy}:any){
 const original=JSON.parse(record.data),[editing,setEditing]=useState(false),[items,setItems]=useState<any[]>(original),[reason,setReason]=useState('');
 const update=(id:string,key:string,value:number)=>setItems(rows=>rows.map(row=>row.id===id?{...row,[key]:value}:row));
 async function save(){if(await act('correctStock',{id:record.id,reason,items:items.map(({id,cases,bottles,restMl}:any)=>({id,cases:Number(cases||0),bottles:Number(bottles||0),restMl:Number(restMl||0)}))})){setEditing(false);setReason('')}}
 return <div className="stock-correction">
  {record.correctedAt&&<p className="notice"><strong>Bestand wurde korrigiert</strong><br/>{new Date(record.correctedAt).toLocaleString('de-DE')} · {record.correctedBy}</p>}
  {!editing?<Button variant="outline" disabled={busy} onClick={()=>{setItems(JSON.parse(record.data));setEditing(true)}}>Bestand korrigieren / ergänzen</Button>:<div className="panel"><h4>Bestandskorrektur</h4><p>Nur Mengen ändern. Die ursprünglichen Werte und jede Änderung bleiben in der Historie sichtbar.</p>{items.map((row:any)=><div className="stock-edit-row" key={row.id}><strong>{row.name}</strong><label>Gebinde<Input type="number" min="0" step="1" value={row.cases} onChange={e=>update(row.id,'cases',Number(e.target.value))}/></label><label>Einzelne Einheiten<Input type="number" min="0" step="1" value={row.bottles} onChange={e=>update(row.id,'bottles',Number(e.target.value))}/></label>{data.drinks.find((d:any)=>d.id===row.id)?.partialBottle&&<label>Rest ml<Input type="number" min="0" max="700" step="1" value={row.restMl||0} onChange={e=>update(row.id,'restMl',Number(e.target.value))}/></label>}<small>Neu gesamt: {fmt(total(row))}</small></div>)}<label>Begründung<textarea required minLength={3} maxLength={300} value={reason} onChange={e=>setReason(e.target.value)} placeholder="Zum Beispiel: Zwei Flaschen beim ersten Zählen übersehen"/></label><div className="actions"><Button disabled={busy||reason.trim().length<3} onClick={save}>Korrektur speichern</Button><Button variant="outline" disabled={busy} onClick={()=>setEditing(false)}>Abbrechen</Button></div></div>}
  {!!record.corrections?.length&&<details className="archive"><summary>Änderungshistorie ({record.corrections.length})</summary>{[...record.corrections].reverse().map((c:any)=><article className="assignment" key={c.id}><strong>{new Date(c.date).toLocaleString('de-DE')} · {c.by}</strong><p>{c.reason}</p>{c.after.map((after:any)=>{const before=c.before.find((x:any)=>x.id===after.id);if(!before||total(before)===total(after))return null;return <small key={after.id}>{after.name}: {fmt(total(before))} → {fmt(total(after))}</small>})}</article>)}</details>}
 </div>
}
