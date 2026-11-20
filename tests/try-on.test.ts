import {test} from 'node:test';
import assert from 'node:assert/strict';
import {placement,smoothLandmarks,trackerKind,type Point,type TrackedPoints} from '../lib/try-on';
import {sampleProducts} from '../lib/catalogue';
import {productSchema} from '../lib/validation';

test('product validation retains calibrated model metadata and rejects invalid scale',()=>{
  const calibration={scale:.8,offset:[0,.1,0] as [number,number,number],rotation:[0,.2,0] as [number,number,number],paired:true};
  assert.deepEqual(productSchema.parse({...sampleProducts[0],tryOnCalibration:calibration}).tryOnCalibration,calibration);
  assert.equal(productSchema.safeParse({...sampleProducts[0],tryOnCalibration:{scale:-1}}).success,false);
});

test('necklaces use shoulder tracking and face meshes never use shoulder indices',()=>{
  assert.equal(trackerKind('Necklaces'),'pose');
  assert.equal(trackerKind('Earrings'),'face');
  assert.equal(trackerKind('Bracelets'),'hand');
  const face:Point[]=Array.from({length:478},()=>({x:.5,y:.5}));
  face[11]={x:.1,y:.2};face[12]={x:.9,y:.2};
  assert.deepEqual(placement('Necklaces',face,{width:960,height:720},true),[]);
  const pose:Point[]=Array.from({length:33},()=>({x:.5,y:.5,visibility:.9}));
  pose[11]={x:.3,y:.6,visibility:.9};pose[12]={x:.7,y:.65,visibility:.9};
  assert.equal(placement('Necklaces',pose,{width:960,height:720},true).length,1);
  assert.deepEqual(smoothLandmarks([{x:0,y:0,z:0}],[{x:1,y:1,z:1}],.5),[{x:.5,y:.5,z:.5}]);
});

test('necklace fitting uses chin and shoulders together and retains face evidence during smoothing',()=>{
  const face:Point[]=Array.from({length:478},()=>({x:.5,y:.5}));
  face[234]={x:.35,y:.35};face[454]={x:.65,y:.35};face[10]={x:.5,y:.15};face[152]={x:.5,y:.55};
  const pose:TrackedPoints=Array.from({length:33},()=>({x:.5,y:.5,visibility:.9}));
  pose[11]={x:.2,y:.7,visibility:.9};pose[12]={x:.8,y:.7,visibility:.9};pose.face=face;
  const fit=placement('Necklaces',pose,{width:960,height:720},true)[0];
  assert.ok(fit.y>.55&&fit.y<.7,'chain starts between chin and shoulder line');
  assert.ok(fit.width<=.315,'chain is bounded by neck/face width');
  const smoothed=smoothLandmarks(pose,pose)!;assert.equal(smoothed.face?.length,478);
  assert.deepEqual(placement('Necklaces',smoothed,{width:960,height:720},true),[fit]);
  assert.equal(placement('Necklaces',face,{width:960,height:720},true).length,1,'close portraits can use face-derived neck anchors');
});

test('automatic previews hide missing, degenerate and low-confidence landmarks',()=>{
  for(const category of ['Earrings','Necklaces','Rings','Bracelets']){
    assert.deepEqual(placement(category,undefined,{width:960,height:720},true),[]);
    assert.deepEqual(placement(category,Array.from({length:478},()=>({x:.5,y:.5})),{width:960,height:720},true),[]);
  }
  const pose=Array.from({length:33},()=>({x:.5,y:.5,visibility:.1}));pose[11].x=.3;pose[12].x=.7;
  assert.deepEqual(placement('Necklaces',pose,{width:960,height:720},true),[]);
});
test('face placement respects pixel aspect and follows a tilted face',()=>{
  const face:Point[]=Array.from({length:478},()=>({x:.5,y:.5}));
  face[234]={x:.3,y:.4};face[454]={x:.7,y:.6};face[10]={x:.55,y:.2};face[152]={x:.45,y:.8};
  const ears=placement('Earrings',face,{width:1000,height:500},true);
  assert.equal(ears.length,2);assert.ok(Math.abs(ears[0].rotation-Math.atan2(100,400))<1e-8);
  assert.ok(ears[0].x<.3&&ears[1].x>.7);assert.ok(ears.every(e=>e.maxHeight!>0));
});
test('wrist tracking rotates with the hand and smoothing drops lost tracking immediately',()=>{
  const hand=Array.from({length:21},()=>({x:.5,y:.5}));
  hand[0]={x:.5,y:.8};hand[9]={x:.5,y:.5};hand[5]={x:.35,y:.5};hand[17]={x:.65,y:.5};
  const wrist=placement('Bracelets',hand,{width:1000,height:500},true)[0];
  assert.ok(wrist.y>.8);assert.ok(Math.abs(wrist.rotation)<1e-8);
  assert.equal(smoothLandmarks(hand,undefined),undefined);
  assert.deepEqual(smoothLandmarks(undefined,hand),hand);
  assert.deepEqual(smoothLandmarks([{x:0,y:0}],[{x:1,y:1}],.5),[{x:.5,y:.5}]);
});
