import {randomBytes} from 'node:crypto';
import {products} from './store';
import {cartSchema,cartTotals,customerSchema} from './validation';
import {HttpError,hash,verifyHmac,session} from './security';
import {hasSupabase,supabaseServer,databaseError} from './supabase';
export function orderRecord(row:Record<string,any>){return {...row.data,_id:row.id,number:row.number,email:row.email,customerId:row.customer_id,paymentStatus:row.payment_status,stockReserved:row.stock_reserved,razorpayOrderId:row.razorpay_order_id,accessHash:row.access_hash,idempotencyKey:row.idempotency_key,createdAt:row.created_at};}
export async function validateCart(input:unknown){const cart=cartSchema.parse(input),catalogue=await products();const items=cart.items.map(i=>{const p=catalogue.find(p=>p.id===i.id),v=p?.variants.find(v=>v.sku===i.sku);if(!p||!v||v.stock<i.quantity)throw new HttpError(409,'A selected item is unavailable. Please update your bag.');return {...i,name:p.name,image:p.images[0],size:v.size,metal:v.metal,price:v.price};});let discount=0;if(cart.coupon){if(!hasSupabase())throw new HttpError(400,'Coupons are unavailable in the sample store.');const {data,error}=await supabaseServer().from('carla_coupons').select('data,used').eq('code',cart.coupon.toUpperCase()).maybeSingle();databaseError(error);const c=data?.data,subtotal=cartTotals(items).subtotal;if(!c||!c.active||Date.parse(c.expiry)<=Date.now()||data!.used>=c.limit||subtotal<(c.minSpend||0))throw new HttpError(400,'This code is unavailable or its minimum spend has not been met.');discount=c.discountType==='percent'?subtotal*Math.min(100,c.value)/100:c.value;}return {items,...cartTotals(items,discount),coupon:cart.coupon?.toUpperCase()};}
async function razor(path:string,body?:unknown){const r=await fetch('https://api.razorpay.com/v1/'+path,{method:body?'POST':'GET',headers:{Authorization:'Basic '+Buffer.from(process.env.RAZORPAY_KEY_ID+':'+process.env.RAZORPAY_KEY_SECRET).toString('base64'),'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(15000)});if(!r.ok)throw new HttpError(502,'The payment provider is unavailable. Please try again.');return r.json();}

export async function releaseOrder(id:string){const {error}=await supabaseServer().rpc('carla_release_order',{p_id:id});databaseError(error);}
export async function createOrder(input:Record<string,unknown>,key:string){
 if(!hasSupabase()||!process.env.RAZORPAY_KEY_ID||!process.env.RAZORPAY_KEY_SECRET)throw new HttpError(503,'Checkout requires Supabase and Razorpay configuration.');
 const customer=customerSchema.parse(input.customer),user=await session(),cart=await validateCart(input),token=randomBytes(32).toString('hex');
 const orderInput={number:'CD-'+Date.now().toString(36).toUpperCase()+'-'+randomBytes(2).toString('hex').toUpperCase(),email:customer.email.toLowerCase(),customerId:user?.role==='customer'?user.sub:null,customer,...cart,accessHash:hash(token),idempotencyKey:key,fulfillmentStatus:'unfulfilled',expiresAt:new Date(Date.now()+1800000).toISOString()};
 const {data,error}=await supabaseServer().rpc('carla_reserve_order',{p_order:orderInput});if(error)throw new HttpError(409,error.code==='23505'?'This checkout has already been submitted.':error.message);const order=orderRecord(data);
 try{const rp=await razor('orders',{amount:Math.round(cart.total*100),currency:'INR',receipt:order.number});const {error:updateError}=await supabaseServer().from('carla_orders').update({razorpay_order_id:rp.id}).eq('id',order._id);databaseError(updateError);return {id:order._id,number:order.number,token,razorpayOrderId:rp.id,amount:rp.amount,keyId:process.env.RAZORPAY_KEY_ID};}catch(e){await releaseOrder(order._id);throw e;}
}
export async function markPaid(rpId:string,paymentId:string,amount:number,currency:string){const {error}=await supabaseServer().rpc('carla_mark_paid',{p_razorpay_id:rpId,p_payment_id:paymentId,p_amount:amount,p_currency:currency});if(error)throw new HttpError(409,error.message);}
export async function verifyPayment(input:Record<string,unknown>){
 const id=String(input.orderId||'');if(!/^[a-f\d-]{36}$/i.test(id))throw new HttpError(404,'Order not found.');
 const {data,error}=await supabaseServer().from('carla_orders').select('*').eq('id',id).maybeSingle();databaseError(error);const order=data?orderRecord(data):null;
 if(!order||hash(String(input.token))!==order.accessHash)throw new HttpError(404,'Order not found.');
 if(!verifyHmac(order.razorpayOrderId+'|'+input.razorpay_payment_id,String(input.razorpay_signature),process.env.RAZORPAY_KEY_SECRET||''))throw new HttpError(400,'Invalid payment signature.');
 const payment=await razor('payments/'+encodeURIComponent(String(input.razorpay_payment_id)));if(payment.order_id!==order.razorpayOrderId)throw new HttpError(400,'Payment order mismatch.');
 if(payment.status!=='captured')return {status:'pending',message:'Payment is awaiting capture.'};await markPaid(order.razorpayOrderId,payment.id,payment.amount,payment.currency);return {status:'paid'};
}
