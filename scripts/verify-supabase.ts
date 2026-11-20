import {loadEnvConfig} from '@next/env';
import {createClient} from '@supabase/supabase-js';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {sampleProducts} from '../lib/catalogue';
import {supabaseServer,mediaBucket,databaseError} from '../lib/supabase';
loadEnvConfig(process.cwd());
async function verify(){
 const client=supabaseServer(),suffix=randomUUID(),id='qa-'+suffix,sku='QA-'+suffix;
 const product={...sampleProducts[0],id,slug:id,name:'Temporary integration verification',price:100,sample:false,variants:[{sku,size:'Standard',metal:'Yellow gold',price:100,stock:1}]};
 const orderIds:string[]=[];const object='qa/'+suffix+'.png';let uploaded=false;
 try{
  const saved=await client.rpc('carla_save_product',{p_product:product,p_existing_id:null});databaseError(saved.error);
  const duplicate=await client.rpc('carla_save_product',{p_product:{...product,id:id+'-duplicate',slug:id+'-duplicate'},p_existing_id:null});assert.ok(duplicate.error,'duplicate SKU must be rejected');
  console.log('Product create and duplicate reference protection passed.');
  const input=()=>({number:'QA-'+randomUUID(),email:'verification@example.invalid',customerId:null,customer:{name:'Verification only'},items:[{id,sku,quantity:1,price:100}],subtotal:100,discount:0,total:100,accessHash:'qa-not-a-customer-token',idempotencyKey:randomUUID()});
  const results=await Promise.all([client.rpc('carla_reserve_order',{p_order:input()}),client.rpc('carla_reserve_order',{p_order:input()})]);
  for(const result of results)if(result.data?.id)orderIds.push(result.data.id);
  assert.equal(orderIds.length,1,'concurrent checkouts must not oversell the final stock unit');
  const pending=orderIds[0];const released=await client.rpc('carla_release_order',{p_id:pending});databaseError(released.error);
  const stock=await client.from('carla_products').select('data').eq('id',id).single();databaseError(stock.error);assert.equal(stock.data!.data.variants[0].stock,1);
  console.log('Concurrent stock reservation and release passed.');
  const reserved=await client.rpc('carla_reserve_order',{p_order:input()});databaseError(reserved.error);orderIds.push(reserved.data.id);
  const rp='qa_order_'+suffix,payment='qa_payment_'+suffix;
  databaseError((await client.from('carla_orders').update({razorpay_order_id:rp}).eq('id',reserved.data.id)).error);
  const invalid=await client.rpc('carla_mark_paid',{p_razorpay_id:rp,p_payment_id:payment,p_amount:1,p_currency:'INR'});assert.ok(invalid.error);
  for(let i=0;i<2;i++)databaseError((await client.rpc('carla_mark_paid',{p_razorpay_id:rp,p_payment_id:payment,p_amount:10000,p_currency:'INR'})).error);
  const movements=await client.from('carla_inventory_movements').select('id',{count:'exact'}).eq('order_id',reserved.data.id);databaseError(movements.error);assert.equal(movements.count,1);
  console.log('Payment amount validation and duplicate-event handling passed (no real payment).');
  const bytes=await readFile('public/images/products/lj-1.png');databaseError((await client.storage.from(mediaBucket).upload(object,bytes,{contentType:'image/png'})).error);uploaded=true;
  const {data:url}=client.storage.from(mediaBucket).getPublicUrl(object);const image=await fetch(url.publicUrl);assert.equal(image.status,200);assert.ok(image.headers.get('content-type')?.startsWith('image/png'));
  console.log('Supabase Storage upload and public image delivery passed.');
  const anon=createClient(process.env.SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{auth:{persistSession:false}});
  const privateRead=await anon.from('carla_customers').select('id').limit(1);assert.ok(privateRead.error,'anonymous users cannot read customers');
  const illegalWrite=await anon.rpc('carla_save_product',{p_product:product,p_existing_id:id});assert.ok(illegalWrite.error,'anonymous users cannot write through RPC');
  console.log('Publishable-key access restrictions passed.');
 }finally{
  if(uploaded)databaseError((await client.storage.from(mediaBucket).remove([object])).error);
  if(orderIds.length){for(const table of ['carla_inventory_movements','carla_payments'])databaseError((await client.from(table).delete().in('order_id',orderIds)).error);databaseError((await client.from('carla_orders').delete().in('id',orderIds)).error);}
  databaseError((await client.from('carla_products').delete().in('id',[id,id+'-duplicate'])).error);
  console.log('Temporary verification records cleaned up.');
 }
}
verify().catch(error=>{console.error(error.message);process.exitCode=1;});
