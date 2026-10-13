import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {sampleProducts,categories} from '../lib/catalogue';
import {placement} from '../lib/try-on';
test('24 distinct catalogue images exist with six pieces in each category',async()=>{
  assert.equal(sampleProducts.length,24);const hashes=new Set<string>();
  for(const category of categories)assert.equal(sampleProducts.filter(p=>p.category===category.name).length,6);
  for(const p of sampleProducts){assert.ok(p.images[0].startsWith('/images/products/'));const bytes=readFileSync('public'+p.images[0]);hashes.add(createHash('sha256').update(bytes).digest('hex'));const metadata=await sharp(bytes).metadata();assert.ok((metadata.width||0)>=800);assert.ok((metadata.height||0)>=800);}
  assert.equal(hashes.size,24,'Distinct products must not reuse the same photograph');
});
test('every product has a transparent preview asset and a valid GLB design study',async()=>{
  for(const p of sampleProducts){assert.ok(p.tryOnAsset);const bytes=readFileSync('public'+p.tryOnAsset);const meta=await sharp(bytes).metadata();assert.equal(meta.hasAlpha,true,p.name);const stats=await sharp(bytes).stats();assert.equal(stats.channels[3].min,0,p.name+' must contain transparent pixels');const model=readFileSync('public'+p.model3D);assert.equal(model.toString('ascii',0,4),'glTF');assert.equal(model.readUInt32LE(4),2);assert.equal(model.readUInt32LE(8),model.length);}
  for(const file of ['/images/editorial/portrait-preview.png','/images/editorial/hand-preview.png','/mediapipe/face.task','/mediapipe/hand.task','/mediapipe/pose.task'])assert.ok(existsSync('public'+file),file);
});
test('tracking places a ring between its finger landmarks near the finger base',()=>{
  const points=Array.from({length:21},()=>({x:.5,y:.5}));points[13]={x:.4,y:.6};points[14]={x:.4,y:.4};const ring=placement('Rings',points)[0];assert.equal(ring.x,.4);assert.ok(Math.abs(ring.y-.536)<1e-8);assert.ok(ring.width>0&&ring.width<.4);assert.ok(Math.abs(ring.rotation)<1e-8);assert.equal(placement('Earrings',undefined).length,2);for(const cat of categories){for(const pos of placement(cat.name,undefined)){assert.ok(pos.x>=0&&pos.x<=1);assert.ok(pos.y>=0&&pos.y<=1);assert.ok(pos.width>0);}}
});

