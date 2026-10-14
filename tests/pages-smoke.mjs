import assert from 'node:assert/strict';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:3000';
const catalogue=await (await fetch(base+'/api/products')).json();
const paths=['/films','/login','/','/store-stories','/shop','/search?q=gold','/new-arrivals','/collections','/collections/golden-edit','/collections/forever','/collections/little-acts-of-love','/category/necklaces','/category/earrings','/category/rings','/category/bracelets','/ai-stylist','/virtual-try-on','/viewer','/wishlist','/cart','/checkout','/payment-status','/track-order','/account','/orders','/size-guide','/about','/contact','/faq','/policies','/admin',...catalogue.products.map(p=>'/product/'+p.slug)];
for(const path of paths){const response=await fetch(base+path);assert.equal(response.status,200,path);const html=await response.text();assert.ok(!html.includes('NEXT_HTTP_ERROR_FALLBACK;500'),path);}
for(const path of ['/try','/try-on','/tryon','/necklaces','/earrings','/rings','/bracelets']){const response=await fetch(base+path,{redirect:'manual'});const html=await response.text();assert.ok(response.status===307||(response.status===200&&html.includes('NEXT_REDIRECT;replace;')),path);}
for(const path of ['/missing-page','/category/missing']){const response=await fetch(base+path);const html=await response.text();assert.ok(response.status===404||(response.status===200&&html.includes('NEXT_HTTP_ERROR_FALLBACK;404')),path);}
console.log(`${paths.length} pages, 7 redirects and 2 missing-route checks passed.`);
