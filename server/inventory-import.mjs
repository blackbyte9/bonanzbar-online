export function importInventory(s,b,admin){
 if(!admin)throw Error('Nur Admin und Master dürfen Inventar importieren.');
 if(!Array.isArray(b.items)||!b.items.length||b.items.length>200)throw Error('Bitte 1 bis 200 Artikel auswählen.');
 if(typeof b.overwrite!=='boolean')throw Error('Importmodus fehlt.');
 const seen=new Set();const additions=[];let skipped=0,updated=0;
 for(const row of b.items){
  if(!row||typeof row.name!=='string'||!row.name.trim()||row.name.trim().length>100)throw Error('Ungültiger Artikelname.');
  const name=row.name.trim(),key=name.toLocaleLowerCase('de');if(seen.has(key))throw Error('Doppelter Artikel in Datei: '+name);seen.add(key);
  for(const k of ['price','guestPrice','purchasePrice','pack'])if(!Number.isSafeInteger(row[k])||row[k]<(k==='pack'?1:0)||row[k]>(k==='pack'?1000:100000))throw Error('Ungültige Preise oder Gebinde bei '+name);
  for(const k of ['showMenu','showTally','showShopping','partialBottle','supply'])if(typeof row[k]!=='boolean')throw Error('Listenauswahl fehlt bei '+name);
  if(!['Flasche','Stück','Gebinde','Packung','Beutel','Dose','Rolle','kg','Liter'].includes(row.unit))throw Error('Ungültige Einheit bei '+name);
  const matches=s.drinks.filter(d=>d.name.trim().toLocaleLowerCase('de')===key);if(matches.length>1)throw Error('Mehrdeutiger vorhandener Artikel: '+name);
  const prior=matches[0];if(prior&&!b.overwrite){skipped++;continue}
  const d={...prior,id:prior?.id||crypto.randomUUID(),name,active:1};
  for(const k of ['price','guestPrice','purchasePrice','pack','unit','showMenu','showTally','showShopping','partialBottle','supply'])d[k]=row[k];
  additions.push(d);if(prior)updated++;
 }
 // Commit only once all rows have passed validation. Existing tallies and stock snapshots stay intact.
 for(const d of additions){const i=s.drinks.findIndex(x=>x.id===d.id);if(i<0)s.drinks.push(d);else s.drinks[i]=d}
 return {ok:true,created:additions.length-updated,updated,skipped};
}
