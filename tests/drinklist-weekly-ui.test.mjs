import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {drinklistWeek} from '../server/drinklist-weeks.mjs';

const root=fileURLToPath(new URL('..',import.meta.url));
const bundle=await build({entryPoints:[root+'/src/drinklist-accounting.tsx'],bundle:true,write:false,format:'cjs',platform:'node',jsx:'automatic',alias:{'@':root},external:['react','react-dom','react/jsx-runtime']});
const module={exports:{}};new Function('require','module','exports',bundle.outputFiles[0].text)(createRequire(import.meta.url),module,module.exports);
const {default:DrinklistAccounting,WeeklyDrinklist}=module.exports;

test('weekly UI shows actual counts per person and is absent for other roles',()=>{
 const data={master:true,drinklistWeeks:[{...drinklistWeek(),people:[{user:'frank',name:'Frank',drinks:[{drink:'beer',name:'Bier',count:7,openCount:4,settledCount:3}]}]}]};
 const html=renderToStaticMarkup(React.createElement(WeeklyDrinklist,{data}));
 for(const text of ['Frank','7 Striche','4 noch offen','3 bereits abgerechnet','Diese Woche als CSV'])assert(html.includes(text),text);
 const shell=renderToStaticMarkup(React.createElement(DrinklistAccounting,{data,onBack:()=>{}}));
 assert(shell.includes('Wochenübersicht'));assert(shell.includes('Abrechnen &amp; Belege'));assert(shell.includes('Korrekturanfragen'));
 for(const role of ['admin','crew','member','guest']){
  assert.equal(renderToStaticMarkup(React.createElement(WeeklyDrinklist,{data:{...data,master:false,role}})),'');
  assert.equal(renderToStaticMarkup(React.createElement(DrinklistAccounting,{data:{...data,master:false,role}})),'');
 }
});
