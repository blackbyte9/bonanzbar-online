export const EVENT_SOURCE='https://bonanzbar.jimdofree.com/';
export const SOURCE_CHECKED='2026-09-21';
const rows=[
['2026-09-26','Open Bar',null,'Offener Barabend mit gemischter Musik.',null],
['2026-10-03','Brandon Wolfe Band','20:00','Live-Musik zwischen Rock, Country und Folk.','brandon-wolfe-band-in-der-bonanzbar-1'],
['2026-10-10','Cry Sis’','20:00','Hardrock- und Metal-Covers aus verschiedenen Jahrzehnten.','cry-sis-0'],
['2026-10-17','Orange & OhrTon','20:00','Zwei regionale Bands mit Rock, eigenen Songs und Punk-Einflüssen.','orange-ohrton-0'],
['2026-10-24','The Policy','20:00','The-Police-Tribute. Auf der Ticketseite als „The Police“ geführt.','the-police-3'],
['2026-10-31','Halloween Party',null,'Halloween-Abend mit DJ Jenser.',null],
['2026-11-07','Wirtnix','20:00','Coverrock in der Bonanzbar.','wirtnix-0'],
['2026-11-14','Geschlossene Gesellschaft',null,'Private Veranstaltung.',null],
['2026-11-21','Die Taucher & Umtausch Ausgeschlossen','20:00','Gemeinsamer Punk-Abend.','die-taucher-support-umtasuch-ausgeschlossen-0'],
['2026-11-28','Geschlossene Gesellschaft',null,'Private Veranstaltung.',null],
['2026-12-05','Nikolaus Unplugged',null,'Akustische Live-Sessions.',null],
['2026-12-12','Blood Sugar Sex Magic','20:00','Red-Hot-Chili-Peppers-Coverband.','blood-sugar-sex-magic-0'],
['2026-12-19','Jesus George','20:00','Rock- und Pop-Coverband.','jesus-george-1']
];
export const seedEvents=rows.map(([day,name,time,description,ticket])=>({id:'bonanzbar-'+day,day,name,time,description,ticket:ticket?'https://rausgegangen.de/events/'+ticket+'/':null,source:EVENT_SOURCE,checked:SOURCE_CHECKED}));
export function normalizeEvent(e){if(!e||typeof e!=='object'||typeof e.name!=='string'||!e.name.trim()||e.name.length>200||!/^\d{4}-\d{2}-\d{2}$/.test(e.day)||new Date(e.day+'T12:00:00Z').toISOString().slice(0,10)!==e.day)throw Error('Ungültige Veranstaltung.');const safe=v=>{if(!v)return null;const u=new URL(v);if(!['http:','https:'].includes(u.protocol))throw Error('Ungültiger Link');return u.href};return {id:typeof e.id==='string'&&e.id.length<300?e.id:'bonanzbar-'+e.day,name:e.name.trim(),day:e.day,time:/^([01]\d|2[0-3]):[0-5]\d$/.test(e.time||'')?e.time:null,description:String(e.description||'').slice(0,2000),ticket:safe(e.ticket),source:EVENT_SOURCE,checked:new Date().toISOString()}}
export function mergeEvents(existing,incoming){const result=existing.map(e=>({...e}));for(const raw of incoming){const e=normalizeEvent(raw);const index=result.findIndex(x=>(e.ticket&&x.ticket===e.ticket)||x.id===e.id||(x.day===e.day&&x.name.toLowerCase()===e.name.toLowerCase()));if(index>=0){const old=result[index];result[index]={...old,...e,id:old.id,time:e.time||old.time,ticket:e.ticket||old.ticket}}else result.push(e)}return result.sort((a,b)=>a.day.localeCompare(b.day))}
// Reads a saved Jimdo homepage without executing scripts or loading its assets.
export function parseHomepage(html,year){if(!Number.isInteger(year)||year<2020||year>2100)throw Error('Bitte ein gültiges Programmjahr wählen.');if(typeof html!=='string'||html.length>10000000)throw Error('Datei zu groß.');const doc=new DOMParser().parseFromString(html,'text/html');doc.querySelectorAll('script,style,iframe,noscript').forEach(x=>x.remove());const parts=[];for(const node of doc.querySelectorAll('h1,h2,h3,h4,p')){const text=(node.textContent||'').replace(/\s+/g,' ').trim();if(text)parts.push({text,node})}const start=parts.findIndex(p=>/COMING UP/i.test(p.text));if(start<0)throw Error('Der Abschnitt „COMING UP“ wurde nicht gefunden. Bitte die vollständige Homepage als HTML speichern.');const result=[];for(const part of parts.slice(start+1)){if(/HIGHLIGHTS|WO DU UNS FINDEST/i.test(part.text))break;const m=part.text.match(/^(\d{2})\.(\d{2})\.\s*(.+)/);if(!m)continue;const name=m[3].replace(/\s*-?\s*TICKET.*$/i,'').replace(/^[-– ]+|[-– ]+$/g,'').trim();const day=`${year}-${m[2]}-${m[1]}`;const anchor=Array.from(part.node.querySelectorAll('a[href]')).find(a=>/rausgegangen\.de/.test(a.getAttribute('href')||''));result.push({id:'bonanzbar-'+day,day,name,time:null,description:'Weitere Bandinfos auf der Homepage.',ticket:anchor?.getAttribute('href')||null})}if(!result.length)throw Error('Keine Veranstaltungstermine erkannt. Die vorhandenen Daten bleiben erhalten.');return mergeEvents([],result)}
