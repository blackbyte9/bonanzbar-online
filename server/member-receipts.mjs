export function memberReceipts(data,user){
 const rows=[...(data.accountReceipts||[]),...(data.receipts||[])];
 return rows.map(r=>({...r,value:JSON.parse(r.data)})).filter(r=>r.value.user===user).sort((a,b)=>b.date.localeCompare(a.date)||b.id.localeCompare(a.id));
}

export function groupedReceiptItems(items){
 const groups=new Map();
 for(const item of items||[]){const key=JSON.stringify([item.drink,item.name,item.price,item.kind]);if(!groups.has(key))groups.set(key,{name:item.name,price:item.price,count:0,total:0});const row=groups.get(key);row.count++;row.total+=item.price}
 return [...groups.values()];
}

export function memberReceiptCsvRows(receipt){
 const v=receipt.value,rows=[['Bonanzbar · Einzelabrechnung'],['Beleg-ID',receipt.id],['Mitglied',v.name],['Kontokennung',v.user],['Abgerechnet am',new Date(receipt.date).toLocaleString('de-DE',{timeZone:'Europe/Berlin'})],['Abgerechnet durch',receipt.by||''],['Position','Anzahl','Einzelpreis EUR','Summe EUR'],...groupedReceiptItems(v.items).map(g=>[g.name,g.count,g.price/100,g.total/100])];
 rows.push(['Abgerechneter Betrag EUR',(v.total??v.items.reduce((n,t)=>n+t.price,0))/100]);
 if(v.previous!=null)rows.push(['Saldo vorher EUR',v.previous/100]);
 if(v.balance!=null)rows.push(['Übertrag danach EUR',v.balance/100]);
 rows.push(['Zahlungsstatus',v.payment?'Verrechnet / bezahlt':'Zahlung nicht bestätigt']);
 if(v.payment)rows.push(['Zahlungsbetrag EUR',v.payment.amount/100],['Zahlungsdatum',v.payment.date],['Zahlungskennung',v.payment.id],['Bestätigt durch',v.payment.confirmedBy],['Bestätigt am',v.payment.confirmedAt]);
 else rows.push(['Hinweis','Abrechnung ist keine Bestätigung eines Zahlungseingangs.']);
 return rows;
}
