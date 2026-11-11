import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,run} from '../server/domain.mjs';
import {memberReceipts,groupedReceiptItems,memberReceiptCsvRows} from '../server/member-receipts.mjs';

export function receiptSeed(){return {...initialState(),inventoryUnified:true,members:[{userId:'master',displayName:'Master'},{userId:'a',displayName:'Alex'},{userId:'b',displayName:'Alex'}],roles:{master:'master',a:'crew',b:'crew'},drinks:[{id:'beer',name:'Bier',price:200,active:1}],accountEntries:[{id:'credit',user:'a',kind:'adjustment',amount:1000,reason:'Guthaben',date:'2026-11-01T10:00:00Z'}],tallies:[{id:'a1',user:'a',drink:'beer',name:'Nur Konto A',price:200,date:'2026-11-10T12:00:00Z',receipt:null},{id:'a2',user:'a',drink:'beer',name:'Nur Konto A',price:300,date:'2026-11-10T13:00:00Z',receipt:null},{id:'b1',user:'b',drink:'beer',name:'Nur Konto B',price:200,date:'2026-11-10T14:00:00Z',receipt:null}]}}

test('each member settles separately; repeated settlements, payment and rename retain earlier receipts under their account ID',async()=>{
 let s=receiptSeed();
 await assert.rejects(run(s,'master',{action:'settleAccount',user:'a',ids:['b1'],requestId:'wrong-account-test'}));
 s=(await run(s,'master',{action:'settleAccount',user:'a',ids:['a1','a2'],requestId:'individual-bill-01'})).state;
 assert.equal(s.tallies.find(t=>t.id==='b1').receipt,null);
 let data=(await run(s,'master')).body;
 assert.equal(memberReceipts(data,'a').length,1);assert.equal(memberReceipts(data,'b').length,0);
 const first=memberReceipts(data,'a')[0];assert.equal(first.value.total,500);assert.equal(first.value.previous,1000);assert.equal(first.value.balance,500);
 const snapshot=JSON.stringify(first);
 s.tallies.push({id:'a3',user:'a',drink:'beer',name:'Neue Runde',price:150,date:'2026-11-11T10:00:00Z',receipt:null});
 s=(await run(s,'master',{action:'settleAccount',user:'a',ids:['a3'],requestId:'individual-bill-02'})).state;
 s=(await run(s,'master',{action:'accountPayment',user:'a',kind:'payout',amount:100,requestId:'individual-payout-1'})).state;
 s.members.find(m=>m.userId==='a').displayName='Alex Neuer Name';s.members.find(m=>m.userId==='a').disabled=true;
 data=(await run(s,'master')).body;
 const history=memberReceipts(data,'a');assert.equal(history.length,2);assert.equal(JSON.stringify(history.find(r=>r.id===first.id)),snapshot);
 assert.equal(data.tallies.filter(t=>t.user==='a').length,0);assert.equal(data.tallies.filter(t=>t.user==='b').length,1);
 assert.equal(memberReceipts(data,'b').length,0);assert.equal(data.people.find(p=>p.id==='a').name,'Alex Neuer Name');
 assert(memberReceiptCsvRows(history.find(r=>r.id===first.id)).some(r=>r[0]==='Abgerechneter Betrag EUR'&&r[1]===5));
});

test('older receipts are attached by user ID, never by a shared display name',()=>{
 const receipt=(id,user)=>({id,kind:'receipt',date:'2026-11-10T12:00:00Z',data:JSON.stringify({user,name:'Alex',items:[{name:'Bier',price:200}]})});
 const data={accountReceipts:[],receipts:[receipt('old-a','a'),receipt('old-b','b')]};
 assert.deepEqual(memberReceipts(data,'a').map(r=>r.id),['old-a']);assert.deepEqual(memberReceipts(data,'b').map(r=>r.id),['old-b']);
 assert.equal(groupedReceiptItems([{drink:'beer',name:'Bier',price:200},{drink:'beer',name:'Bier',price:300},{drink:'beer',name:'Bier',price:200}]).length,2);
});
