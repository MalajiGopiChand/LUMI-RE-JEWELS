import {test} from 'node:test';
import assert from 'node:assert/strict';
import {siteSettingsSchema,defaultSiteSettings} from '../lib/site-settings';
import {productSchema} from '../lib/validation';
import {sampleProducts} from '../lib/catalogue';
test('managed page and gallery assets reject executable and cross-origin-relative URLs',()=>{
  for(const image of ['javascript:alert(1)','//untrusted.example/image.png','data:text/html,x']){
    assert.equal(siteSettingsSchema.safeParse({...defaultSiteSettings,pages:{home:{title:'Collection',image}}}).success,false);
  }
  const parsed=siteSettingsSchema.parse({...defaultSiteSettings,pages:{home:{title:'Collection',image:'/api/media/123'}}});
  assert.equal(parsed.pages.home?.image,'/api/media/123');
  assert.equal(parsed.stories.length,18);
});
test('products retain collection memberships and reject invalid stock on admin save',()=>{
  const input={...sampleProducts[0],collectionIds:['golden-edit','wedding-edit'],badge:'New',status:'draft'};
  assert.deepEqual(productSchema.parse(input).collectionIds,input.collectionIds);
  assert.equal(productSchema.safeParse({...input,collectionIds:['../invalid']}).success,false);
  assert.equal(productSchema.safeParse({...input,variants:[{...input.variants[0],stock:-1}]}).success,false);
});
