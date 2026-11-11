import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const root=fileURLToPath(new URL('..',import.meta.url));
const built=await build({entryPoints:[root+'/src/management.tsx'],bundle:true,write:false,format:'cjs',platform:'node',jsx:'automatic',alias:{'@':root},external:['react','react-dom','react/jsx-runtime']});
const module={exports:{}};new Function('require','module','exports',built.outputFiles[0].text)(createRequire(import.meta.url),module,module.exports);
const {MemberAccount,MemberAccounts}=module.exports;

test('history stays below the correct name with an empty drinklist and is master-only',()=>{
 const p={id:'a',name:'Frank',email:'frank@test.invalid',role:'crew'};
 const record=(id,user,name,item)=>({id,date:'2026-11-11T10:00:00Z',by:'Master',data:JSON.stringify({user,name,items:[{name:item,price:200}],total:200,previous:500,balance:300})});
 const data={master:true,people:[p],accountEntries:[],tallies:[],accountReceipts:[record('a1','a','Frank','Nur für Frank'),record('b1','b','Klaas','Nur für Klaas')],receipts:[]};
 const html=renderToStaticMarkup(React.createElement(MemberAccount,{p,data,busy:false,act:()=>{},confirm:()=>{}}));
 assert(html.includes('Bisherige Abrechnungen von Frank'));assert(html.includes('1 gespeicherte Abrechnung'));assert(html.includes('Nur für Frank'));assert(!html.includes('Nur für Klaas'));assert(html.includes('Keine offenen Positionen'));assert(html.includes('Beleg als CSV herunterladen'));
 for(const component of [MemberAccount,MemberAccounts])assert.equal(renderToStaticMarkup(React.createElement(component,{p,data:{...data,master:false}})),'');
 const guest={...p,role:'guest'};const list=renderToStaticMarkup(React.createElement(MemberAccounts,{data:{...data,people:[guest]},act:()=>{},confirm:()=>{}}));assert(list.includes('Bisherige Abrechnungen von Frank'));
});
