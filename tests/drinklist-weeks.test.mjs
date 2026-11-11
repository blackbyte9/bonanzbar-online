import test from 'node:test';
import assert from 'node:assert/strict';
import {drinklistWeek,shiftDrinklistWeek,drinklistWeeks,weekDrinklistView,weeklyDrinklistCsvRows} from '../server/drinklist-weeks.mjs';
import {initialState,run} from '../server/domain.mjs';
import {viewAs} from '../server/preview.mjs';

const tally=(id,user,drink,date='2026-11-10T12:00:00Z',extra={})=>({id,user,drink,date,price:200,name:drink,receipt:null,...extra});
function seed(){return {...initialState(),inventoryUnified:true,members:['master','admin','crew','member','guest','other'].map(userId=>({userId,displayName:['crew','other'].includes(userId)?'Alex':userId,email:userId+'@test.invalid'})),roles:{master:'master',admin:'admin',crew:'crew',member:'member',guest:'guest',other:'crew'},drinks:[{id:'beer',name:'Bier',active:0,showTally:false},{id:'jacky',name:'Jacky Cola',inventoryCategory:'Schnaps',active:1}],tallies:[]}}

test('calendar weeks use Berlin Monday boundaries in winter and summer',()=>{
 assert.equal(drinklistWeek('2026-11-08T22:59:59Z').key,'2026-W45');
 assert.equal(drinklistWeek('2026-11-08T23:00:00Z').key,'2026-W46');
 assert.equal(drinklistWeek('2026-11-15T22:59:59Z').key,'2026-W46');
 assert.equal(drinklistWeek('2026-11-15T23:00:00Z').key,'2026-W47');
 assert.equal(drinklistWeek('2026-07-05T21:59:59Z').key,'2026-W27');
 assert.equal(drinklistWeek('2026-07-05T22:00:00Z').key,'2026-W28');
 assert.equal(drinklistWeek('2026-10-25T00:30:00Z').key,drinklistWeek('2026-10-25T01:30:00Z').key);
});

test('ISO week year and week navigation stay correct at new year',()=>{
 assert.deepEqual(drinklistWeek('2027-01-01T12:00:00Z'),{key:'2026-W53',year:2026,week:53,start:'2026-12-28',end:'2027-01-03'});
 assert.equal(shiftDrinklistWeek('2026-12-28',1).key,'2027-W01');
 assert.equal(shiftDrinklistWeek('2027-01-04',-1).key,'2026-W53');
 assert.equal(drinklistWeek('2025-12-29T12:00:00Z').key,'2026-W01');
});

test('weekly counts include settled and hidden drinks, exclude voids and allocations, and separate duplicate names',()=>{
 const s=seed();s.tallies=[tally('one','crew','beer'),tally('two','crew','beer',undefined,{receipt:'paid'}),tally('three','other','jacky'),tally('void','crew','beer',undefined,{void:true}),tally('allocation','crew',null,undefined,{kind:'allocation'}),tally('bad','crew','beer','not a date'),tally('old','crew','beer','2026-11-08T22:59:59Z')];
 s.tallies.push({...s.tallies[0]});
 const weeks=drinklistWeeks(s),w=weeks[0];
 assert.equal(w.key,'2026-W46');assert.equal(w.count,3);assert.equal(w.openCount,2);assert.equal(w.settledCount,1);assert.equal(w.people.length,2);assert.equal(weeks[1].count,1);
 assert.deepEqual(w.people.map(p=>[p.user,p.name,p.count]),[['crew','Alex',2],['other','Alex',1]]);
 const filtered=weekDrinklistView(w,true);assert.equal(filtered.count,2);assert.equal(filtered.people.length,1);
 const csv=weeklyDrinklistCsvRows(w,true);assert(csv.some(r=>r[0]==='Alle Personen'&&r[2]===2));assert(!csv.some(r=>r.includes('Jacky Cola')));
});

test('settling a member keeps marks in their original week and changes only settlement status',async()=>{
 const s=seed();s.tallies=[tally('one','crew','beer')];
 const before=drinklistWeeks(s)[0];
 const out=await run(s,'master',{action:'settleAccount',user:'crew',ids:['one'],requestId:'weekly-settlement-01'});
 const after=drinklistWeeks(out.state)[0];
 assert.equal(after.key,before.key);assert.equal(after.count,1);assert.equal(after.openCount,0);assert.equal(after.settledCount,1);
});

test('weekly data and settlement remain master-only, including role preview',async()=>{
 const s=seed();s.tallies=[tally('one','crew','beer')];
 assert.equal((await run(s,'master')).body.drinklistWeeks[0].count,1);
 for(const role of ['admin','crew','member','guest']){
  assert.equal((await run(s,role)).body.drinklistWeeks,undefined);
  await assert.rejects(run(s,role,{action:'settleAccount',user:'crew',ids:['one'],requestId:'weekly-forbidden-01'}));
 }
 assert.equal((await viewAs(s,'master','admin')).drinklistWeeks,undefined);
 await assert.rejects(viewAs(s,'admin','master'));
});
