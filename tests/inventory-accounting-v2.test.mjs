import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,run} from '../server/domain.mjs';
import {calculateInventory,calculateInterim} from '../server/management.mjs';

const stock=(id,date,cases,bottles=0)=>({id,kind:'stock',date,by:'Test',data:JSON.stringify([{id:'beer',name:'Bier',pack:20,purchasePrice:100,cases,bottles,restMl:0,supply:false}])});
const order=(id,date,cases,bottles=0)=>({id,kind:'order',date,by:'Test',data:JSON.stringify([{id:'beer',name:'Bier',pack:20,cases,bottles}])});
function accountingState(){return {events:[{id:'event',name:'Konzert',day:'2026-10-10'}],drinks:[{id:'beer',name:'Bier',pack:20,purchasePrice:100}],records:[stock('before','2026-10-10T10:00:00Z',2),order('delivery','2026-10-10T16:00:00Z',1),stock('after','2026-10-10T23:00:00Z',1,10)],eventAccounts:[]}}

test('event accounting adds selected deliveries and subtracts other costs',()=>{const s=accountingState(),calc=calculateInventory(s,{event:'event',before:'before',after:'after',orders:['delivery']});assert.equal(calc.items[0].before,40);assert.equal(calc.items[0].delivered,20);assert.equal(calc.items[0].after,30);assert.equal(calc.items[0].consumed,30);assert.equal(calc.cost,3000)});
test('unselected delivery cannot silently explain higher ending stock',()=>{const s=accountingState();s.records[2]=stock('after','2026-10-10T23:00:00Z',3);assert.throws(()=>calculateInventory(s,{event:'event',before:'before',after:'after',orders:[]}));assert.equal(calculateInventory(s,{event:'event',before:'before',after:'after',orders:['delivery']}).items[0].consumed,0)});
test('interim allows earlier orders confirmed as received in period but rejects future orders',()=>{const s=accountingState();s.records[1].date='2026-10-09T16:00:00Z';assert.equal(calculateInterim(s,{before:'before',after:'after',orders:['delivery']}).items[0].delivered,20);s.records[1].date='2026-10-11T16:00:00Z';assert.throws(()=>calculateInterim(s,{before:'before',after:'after',orders:['delivery']}))});

test('higher end stock: 40 + 20 delivery - 4 drinklist = expected and actual 56',()=>{
 const s=accountingState();s.records[2]=stock('after','2026-10-10T23:00:00Z',2,16);
 s.tallies=Array.from({length:4},(_,i)=>({id:'mark-'+i,drink:'beer',date:'2026-10-10T18:00:00Z',receipt:i%2?'paid-receipt':null}));
 const a=calculateInterim(s,{before:'before',after:'after',orders:['delivery']});
 assert.equal(a.items[0].available,60);assert.equal(a.items[0].tallyCount,4);assert.equal(a.items[0].expectedAfter,56);assert.equal(a.items[0].after,56);assert.equal(a.items[0].variance,0);assert.equal(a.cost,400);assert.equal(a.tallyCost,400);
 s.records[2]=stock('after','2026-10-10T23:00:00Z',2,14);
 assert.equal(calculateInterim(s,{before:'before',after:'after',orders:['delivery']}).items[0].variance,-2);
});

test('drinklist counts exclude start boundary, voids, allocations and outside period; include end boundary and paid hidden drinks',()=>{
 const s=accountingState();s.drinks[0].active=0;s.drinks[0].showTally=false;
 s.tallies=[{id:'start',drink:'beer',date:'2026-10-10T10:00:00Z'},{id:'end',drink:'beer',date:'2026-10-10T23:00:00Z',receipt:'paid'},{id:'late',drink:'beer',date:'2026-10-10T23:00:01Z'},{id:'void',drink:'beer',date:'2026-10-10T20:00:00Z',void:true},{id:'allocation',kind:'allocation',date:'2026-10-10T20:00:00Z'},{id:'old',drink:'beer',date:'2026-10-09T20:00:00Z'}];
 assert.equal(calculateInterim(s,{before:'before',after:'after'}).tallyCount,1);
});

test('0.7-l bottle: seven 20-ml marks consume 0.2 bottles, never seven bottles',()=>{
 const s=accountingState();s.drinks[0].partialBottle=true;
 s.tallies=Array.from({length:7},(_,i)=>({id:'shot-'+i,drink:'beer',date:'2026-10-10T18:00:00Z'}));
 assert.throws(()=>calculateInterim(s,{before:'before',after:'after'}),/Menge pro Drinklist/);
 const a=calculateInterim(s,{before:'before',after:'after',tallyUnits:{beer:20/700}});
 assert.equal(a.items[0].tallyQuantity,0.2);assert.equal(a.items[0].expectedAfter,39.8);assert.equal(a.tallyCost,20);
});

test('unexpected surplus remains visible rather than blocking interim reconciliation',()=>{
 const s=accountingState();s.records[2]=stock('after','2026-10-10T23:00:00Z',3,2);
 const a=calculateInterim(s,{before:'before',after:'after',orders:['delivery']});assert.equal(a.items[0].variance,2);assert.equal(a.items[0].consumed,-2);
});

test('master receives history for preview; crew/admin do not; closing rejects changed draft',async()=>{
 let s={...initialState(),...accountingState(),inventoryUnified:true,members:['master','admin','crew'].map(userId=>({userId,displayName:userId})),roles:{master:'master',admin:'admin',crew:'crew'}};
 s.tallies=[{id:'paid-mark',drink:'beer',date:'2026-10-10T18:00:00Z',receipt:'paid'}];
 const data=(await run(s,'master')).body;assert.equal(data.inventoryTallies.length,1);assert.equal(data.tallies.length,0);
 for(const role of ['admin','crew'])assert.equal((await run(s,role)).body.inventoryTallies,undefined);
 const preview=calculateInterim({records:[...data.stock,...data.orders],drinks:data.inventoryDrinks,tallies:data.inventoryTallies},{before:'before',after:'after',orders:['delivery']});
 s=(await run(s,'master',{action:'saveInterimAccount',id:'draft',title:'Soll-Ist',before:'before',after:'after',orders:['delivery'],requestId:'save-interim-draft'})).state;
 assert.deepEqual(s.interimAccounts[0].items,preview.items);
 const closed=(await run(s,'master',{action:'closeInterimAccount',id:'draft',requestId:'close-interim-001'})).state;assert.equal(closed.interimAccounts[0].closed,true);
 s.tallies.push({id:'another-mark',drink:'beer',date:'2026-10-10T19:00:00Z'});
 await assert.rejects(run(s,'master',{action:'closeInterimAccount',id:'draft',requestId:'close-interim-002'}),/neu berechnen/);
});
test('stock correction keeps compact old/new audit and current value',async()=>{let s=initialState();s.inventoryUnified=true;s.members=[{userId:'admin',displayName:'Admin'}];s.roles={admin:'admin'};s.drinks=[{id:'beer',name:'Bier',pack:20,price:100,guestPrice:200,purchasePrice:50,active:1}];s.records=[stock('stock','2026-10-10T10:00:00Z',2)];const out=await run(s,'admin',{action:'correctStock',id:'stock',reason:'Eine Kiste übersehen',items:[{id:'beer',cases:3,bottles:2,restMl:0}],requestId:'correction-request-1'});const record=out.state.records[0];assert.equal(JSON.parse(record.data)[0].cases,3);assert.equal(record.corrections.length,1);assert.equal(record.corrections[0].before[0].cases,2);assert.equal(record.corrections[0].after[0].bottles,2);assert.equal(record.corrections[0].reason,'Eine Kiste übersehen')});
test('event and interim records include other costs',async()=>{let s=initialState();s.inventoryUnified=true;s.members=[{userId:'master',displayName:'Master'}];s.roles={master:'master'};Object.assign(s,accountingState());let out=await run(s,'master',{action:'saveEventAccount',event:'event',before:'before',after:'after',orders:['delivery'],incomeDrinks:10000,incomeTickets:0,incomeOther:0,otherCosts:500,requestId:'event-account-0001'});assert.equal(out.state.eventAccounts[0].profit,6500);out=await run(out.state,'master',{action:'saveInterimAccount',id:'interim-1',title:'Zwischen zwei Konzerten',before:'before',after:'after',orders:['delivery'],otherCosts:700,requestId:'interim-account-01'});assert.equal(out.state.interimAccounts[0].totalCost,3700)});
