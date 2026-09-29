export const shoppingUnits=['Stück','Flasche','Gebinde','Packung','Beutel','Dose','Rolle','kg','Liter'];
export const defaultShoppingCatalog=[['Wodka','Flasche'],['Jacky','Flasche'],['Schnaps','Flasche'],['Gin','Flasche'],['Knabberzeug','Packung'],['Weißwein','Flasche'],['Rotwein','Flasche'],['Handtücher','Stück'],['Spülmittel','Flasche'],['Klopapier','Packung'],['Bodenreiniger','Flasche'],['Servietten','Packung'],['Spültabs','Packung'],['Spätzle (2-kg-Packung)','Packung'],['Kochsahne','Packung'],['Käsemischung','Packung'],['Limetten','Stück'],['Orangen','Stück'],['Gurken','Stück'],['Prosecco','Flasche'],['Joster','Flasche'],['Eckes','Flasche'],['Ramazotti','Flasche']].map(([name,unit],i)=>({id:'standard-'+i,name,unit,active:true}));
export const catalog=s=>s.shoppingCatalog??defaultShoppingCatalog;
export function shoppingChoices(s){return [...catalog(s).filter(x=>x.active).map(x=>({...x,key:'article:'+x.id,source:'Artikel'})),...s.drinks.filter(d=>d.active&&!(s.shoppingHiddenDrinks||[]).includes(d.id)).map(d=>({id:d.id,key:'drink:'+d.id,name:d.name,unit:'Flasche',source:'Getränkebestand'}))].sort((a,b)=>a.name.localeCompare(b.name,'de'));}
export function shoppingAction(s,b,{admin,staff,u,id,now}){
 if(!['shop','saveShoppingArticle','setShoppingDrink'].includes(b.action))return null;
 if(!staff)throw Error('Einkaufsliste ist nur für Crew, Admin und Master.');
 if(b.action!=='shop'&&!admin)throw Error('Nur Admin oder Master darf Einkaufsartikel konfigurieren.');
 if(b.action==='setShoppingDrink'){if(!s.drinks.some(d=>d.id===b.id)||typeof b.visible!=='boolean')throw Error('Ungültiges Getränk.');s.shoppingHiddenDrinks=(s.shoppingHiddenDrinks||[]).filter(id=>id!==b.id);if(!b.visible)s.shoppingHiddenDrinks.push(b.id);return {ok:true};}
 if(b.action==='saveShoppingArticle'){
  const name=String(b.name||'').trim();if(!name||name.length>150||!shoppingUnits.includes(b.unit)||typeof b.active!=='boolean')throw Error('Name, Einheit und Status prüfen.');
  s.shoppingCatalog??=structuredClone(defaultShoppingCatalog);const prior=s.shoppingCatalog.find(x=>x.id===b.id);if(b.id&&!prior)throw Error('Artikel nicht gefunden.');if(s.shoppingCatalog.some(x=>x.id!==b.id&&x.name.toLocaleLowerCase('de')===name.toLocaleLowerCase('de')))throw Error('Dieser Artikel ist bereits vorhanden.');const row={id:prior?.id||id,name,unit:b.unit,active:b.active};if(prior)Object.assign(prior,row);else s.shoppingCatalog.push(row);return {ok:true};
 }
 const choice=b.article?shoppingChoices(s).find(x=>x.key===b.article):null;if(b.article&&!choice)throw Error('Dieser Artikel ist nicht mehr auswählbar.');const name=choice?.name||String(b.name||'').trim(),quantity=b.quantity??1,unit=b.unit??choice?.unit??'Stück';
 if(!name||name.length>300||typeof quantity!=='number'||!Number.isFinite(quantity)||quantity<=0||quantity>100000||Math.abs(quantity*1000-Math.round(quantity*1000))>0.00001||!shoppingUnits.includes(unit))throw Error('Artikel, positive Menge (maximal 3 Nachkommastellen) und Einheit prüfen.');
 if(!s.shopping.some(x=>x.id===id))s.shopping.unshift({id,name,quantity,unit,article:choice?.key||null,by:u.displayName,date:now,done:0});return {ok:true};
}
