import assert from 'node:assert/strict';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:3000';
async function request(path,body,origin=base){const r=await fetch(base+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',Origin:origin},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json()};}
const catalogue=await request('/api/products');assert.equal(catalogue.status,200);assert.equal(catalogue.data.total,24);assert.equal(catalogue.data.products.length,24);
const line={id:'lj-1',sku:'LJ-1-1',quantity:2};
const cart=await request('/api/cart/validate',{items:[line],price:1,total:1});assert.equal(cart.status,200);assert.equal(cart.data.total,37000);
assert.equal((await request('/api/cart/validate',{items:[line,line]})).status,400);
assert.equal((await request('/api/cart/validate',{items:[{...line,quantity:10}]})).status,409);
assert.equal((await request('/api/cart/validate',{items:[line]},'https://untrusted.example')).status,403);
assert.equal((await request('/api/admin/products')).status,401);
const style=await request('/api/ai/stylist',{category:'Rings',budget:30000,occasion:'Gifting',metal:'Yellow gold'});assert.equal(style.status,200);assert.ok(style.data.productIds.length>0);assert.ok(style.data.productIds.every(id=>catalogue.data.products.some(p=>p.id===id&&p.category==='Rings'&&p.price<=30000&&p.metal==='Yellow gold')));
const unavailable=await request('/api/ai/stylist',{category:'All',budget:10000,metal:'White gold'});assert.equal(unavailable.status,200);assert.deepEqual(unavailable.data.productIds,[]);
assert.equal((await request('/api/newsletter',{email:'test@example.com'})).status,503);
console.log('9 API smoke checks passed: catalogue, authoritative totals, duplicate lines, stock, origin, admin access, budget/category matching, metal matching, service gating.');
