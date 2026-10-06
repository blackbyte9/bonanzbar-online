export function csvCell(v){
 const raw=typeof v==='number'&&Number.isFinite(v)?Number(v.toFixed(6)).toString().replace('.',','):String(v??'');
 const safe=typeof v==='number'?raw:raw.replace(/^[=+@-]/,"'$&");return '"'+safe.replaceAll('"','""')+'"';
}
