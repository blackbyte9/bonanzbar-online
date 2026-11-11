import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,run} from '../server/domain.mjs';
function seed(){return {...initialState(),members:[{userId:'m',displayName:'Master'},{userId:'a',displayName:'Alex'}],roles:{m:'master',a:'crew'},accountEntries:[{id:'debt',user:'a',kind:'drinks',amount:-500}],records:[{id:'receipt-1',kind:'accountReceipt',date:'2026-11-11T10:00:00Z',data:JSON.stringify({user:'a',name:'Alex',total:500,previous:0,balance:-500,items:[]})}]};}
test('receipt payment books money once, preserves snapshot and rejects unauthorized or duplicate confirmations',async()=>{
 let s=seed();const command={action:'receiptPayment',user:'a',receipt:'receipt-1',amount:500,requestId:'payment-receipt-01'};
 await assert.rejects(run(s,'a',command));
 await assert.rejects(run(s,'m',{...command,user:'m'}));
 await assert.rejects(run(s,'m',{...command,amount:501}));
 s=(await run(s,'m',command)).state;
 assert.equal(s.accountEntries.reduce((n,e)=>n+e.amount,0),0);
 const v=JSON.parse(s.records[0].data);assert.equal(v.balance,-500);assert.equal(v.payment.amount,500);
 assert.equal(s.accountEntries[1].receiptId,'receipt-1');
 await assert.rejects(run(s,'m',{...command,requestId:'payment-receipt-02'}));
});
test('existing money is linked without booking twice and cannot be reused',async()=>{
 let s=seed();s.accountEntries.push({id:'money',user:'a',kind:'received',amount:500,date:'2026-11-11T11:00:00Z',by:'Master'});
 s=(await run(s,'m',{action:'receiptPayment',user:'a',receipt:'receipt-1',paymentId:'money',requestId:'existing-payment-01'})).state;
 assert.equal(s.accountEntries.length,2);assert.equal(JSON.parse(s.records[0].data).payment.date,'2026-11-11T11:00:00Z');
 s.records.push({...s.records[0],id:'receipt-2',data:JSON.stringify({user:'a',items:[]})});
 await assert.rejects(run(s,'m',{action:'receiptPayment',user:'a',receipt:'receipt-2',paymentId:'money',requestId:'existing-payment-02'}));
});
