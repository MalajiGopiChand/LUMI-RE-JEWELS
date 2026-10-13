import {test} from 'node:test';
import assert from 'node:assert/strict';
import {faceProfile,faceEdit} from '../lib/face-style';
import {sampleProducts} from '../lib/catalogue';
const face=()=>{const p=Array.from({length:478},()=>({x:.5,y:.5}));p[234]={x:.3,y:.5};p[454]={x:.7,y:.5};p[10]={x:.5,y:.2};p[152]={x:.5,y:.8};return p;};
test('face proportions account for portrait dimensions and reject incomplete input',()=>{
  const p=face();assert.equal(faceProfile(p,1000,1000)?.proportion,'longer');assert.equal(faceProfile(p,1500,1000)?.proportion,'broader');assert.equal(faceProfile(undefined,1000,1000),null);assert.equal(faceProfile([],1000,1000),null);p[454]={x:NaN,y:.5};assert.equal(faceProfile(p,1000,1000),null);
});
test('face edit changes jewellery choices and only recommends available try-on products',()=>{
  const long=faceEdit({proportion:'longer',ratio:1.6},sampleProducts),broad=faceEdit({proportion:'broader',ratio:1.1},sampleProducts);
  assert.notEqual(long.products[0].id,broad.products[0].id);assert.match(long.products[0].name,/Hoop/);assert.match(broad.products[0].name,/Aurora/);
  for(const p of long.products){assert.ok(p.tryOnAsset);assert.ok(p.variants.some(v=>v.stock>0));}assert.equal(new Set(long.products.map(p=>p.id)).size,long.products.length);
  assert.deepEqual(faceEdit({proportion:'balanced',ratio:1.3},sampleProducts.map(p=>({...p,status:'draft'}))).products,[]);
});
