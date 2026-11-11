import {Button} from '@/components/ui/button';
import {groupedReceiptItems,memberReceiptCsvRows} from '../server/member-receipts.mjs';
import {csvCell} from '../server/csv-format.mjs';

const money=(n:number)=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(n/100);
const stamp=(d:string)=>new Date(d).toLocaleString('de-DE',{timeZone:'Europe/Berlin'});
function download(receipt:any){const csv='\ufeff'+memberReceiptCsvRows(receipt).map((r:any[])=>r.map(csvCell).join(';')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})),link=document.createElement('a');link.href=url;link.download='Bonanzbar-Abrechnung-'+String(receipt.value.name||'Mitglied').replace(/[^\p{L}\p{N}_-]/gu,'_')+'-'+receipt.date.slice(0,10)+'-'+receipt.id.replace(/[^a-zA-Z0-9-]/g,'')+'.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}

export default function MemberReceiptHistory({person,receipts,entries=[],balance=0,act,busy,confirm}:any){return <section className="member-receipt-history" aria-label={'Bisherige Abrechnungen von '+person.name}>
 <h3>Bisherige Abrechnungen von {person.name} ({receipts.length})</h3>
 <p>Die Belege bleiben unter diesem Konto sichtbar, auch wenn die offene Drinklist wieder leer ist.</p>
 {!receipts.length&&<p className="muted">Für diese Person wurde noch keine Abrechnung gespeichert.</p>}
 {receipts.map((r:any)=>{const v=r.value,total=v.total??v.items.reduce((n:number,t:any)=>n+t.price,0);return <details className="archive personal-receipt" key={r.id}>
  <summary><strong>{stamp(r.date)}</strong><span> · {money(total)} · {v.payment?'✓ Verrechnet / bezahlt':'Abgerechnet · Zahlung nicht bestätigt'}</span></summary>
  <small>Beleg {r.id} · Abgerechnet durch {r.by||'nicht hinterlegt'}</small>
  {v.name!==person.name&&<p>Name bei der Abrechnung: {v.name}</p>}
  <div className="metric-grid">{v.previous!=null&&<div>Saldo vorher<strong>{money(v.previous)}</strong></div>}<div>Verrechnete Positionen<strong>{money(total)}</strong></div>{v.balance!=null&&<div>Übertrag danach<strong>{money(v.balance)}</strong></div>}</div>
  <h4>Abgerechnete Positionen</h4>
  {groupedReceiptItems(v.items).map((g:any,i:number)=><div className="list-row" key={i}><div><strong>{g.name}</strong><small>{g.count} × {money(g.price)}</small></div><b>{money(g.total)}</b></div>)}
  <p className="muted">Gespeicherter Stand dieser Abrechnung. Spätere Striche oder Zahlungen ändern diesen Beleg nicht. Eine Abrechnung ist keine Zahlungsbestätigung.</p>
  {v.payment?<p role="status"><strong>✓ Verrechnet / bezahlt</strong><br/>{v.payment.amount<0?'Ausgezahlt':'Zahlung erhalten'}: {money(Math.abs(v.payment.amount))} · {stamp(v.payment.date)}<br/>Bestätigt von {v.payment.confirmedBy} am {stamp(v.payment.confirmedAt)}</p>:r.kind==='accountReceipt'&&act&&<form className="event-form" onSubmit={e=>{e.preventDefault();const fields=new FormData(e.currentTarget),paymentId=String(fields.get('paymentId')||''),amount=Math.round(Number(String(fields.get('amount')||'').replace(',','.'))*100);confirm({title:'Abrechnung als verrechnet bestätigen?',text:paymentId?'Die gewählte Zahlung wird diesem Beleg zugeordnet. Es wird kein weiteres Geld gebucht. Bestätige nur, wenn diese Abrechnung damit vollständig erledigt ist.':`${money(amount)} Zahlungseingang für ${person.name} buchen und diese Abrechnung als vollständig verrechnet markieren. Teilzahlungen bitte unter Kontobewegungen erfassen.`,run:()=>act('receiptPayment',{user:person.id,receipt:r.id,...(paymentId?{paymentId}:{amount})})})}}>
   <h4>Zahlung bestätigen</h4>
   <label>Bereits gebuchte Zahlung<select name="paymentId"><option value="">Neue Zahlung erhalten</option>{entries.filter((e:any)=>['received','payout'].includes(e.kind)&&!e.receiptId).map((e:any)=><option key={e.id} value={e.id}>{stamp(e.date)} · {money(e.amount)}</option>)}</select></label>
   <label>Betrag in Euro (nur bei neuer Zahlung)<input name="amount" type="number" step="0.01" min="0.01" max={Math.max(0,-balance)/100} placeholder={balance<0?(-balance/100).toFixed(2):'Keine offene Kontoschuld'}/></label>
   <p>Nur bestätigen, wenn Geld geflossen und dieser Beleg vollständig erledigt ist. Eine bestehende Zahlung wird nicht erneut gebucht. Guthaben und Helfergutschriften bleiben erhalten.</p>
   <Button disabled={busy} type="submit">Als verrechnet / bezahlt setzen</Button>
  </form>}
  <Button variant="outline" onClick={()=>download(r)}>Beleg als CSV herunterladen</Button>
 </details>})}
 </section>}
