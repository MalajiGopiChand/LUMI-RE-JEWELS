import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {db} from './db';
import {ProductModel,Content} from '@/models';
import {sampleProducts,type Product} from './catalogue';
import {defaultSiteSettings,siteSettingsSchema,type SiteSettings} from './site-settings';
type LocalStore={products:Product[];site:SiteSettings};
const directory=path.join(process.cwd(),'.data');
const file=path.join(directory,'boutique.json');
let queue:Promise<unknown>=Promise.resolve();
let initialization:Promise<void>|undefined;
async function initializeCatalogue(){
  if(!initialization)initialization=(async()=>{
    const marker=await Content.exists({kind:'system',key:'catalogue-initialized'});
    if(marker)return;
    if(!await ProductModel.exists({}))await ProductModel.bulkWrite(sampleProducts.map(product=>({updateOne:{filter:{id:product.id},update:{$setOnInsert:product},upsert:true}})));
    await Content.updateOne({kind:'system',key:'catalogue-initialized'},{$set:{data:{initializedAt:new Date().toISOString()}}},{upsert:true});
  })().catch(error=>{initialization=undefined;throw error;});
  await initialization;
}
async function local():Promise<LocalStore>{
  try{return JSON.parse(await readFile(file,'utf8'));}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;return {products:structuredClone(sampleProducts),site:structuredClone(defaultSiteSettings)};}
}
async function mutate<T>(fn:(data:LocalStore)=>T):Promise<T>{
  if(process.env.NODE_ENV==='production')throw new Error('Database is not configured. Set MONGODB_URI to save live store updates.');
  const operation=queue.then(async()=>{const data=await local();const result=fn(data);await mkdir(directory,{recursive:true});const temp=file+'.'+randomUUID()+'.tmp';await writeFile(temp,JSON.stringify(data,null,2),'utf8');await rename(temp,file);return result;});
  queue=operation.catch(()=>undefined);return operation;
}
export async function catalogue(includeDrafts=false):Promise<Product[]>{
  if(process.env.MONGODB_URI){await db();await initializeCatalogue();return JSON.parse(JSON.stringify(await ProductModel.find(includeDrafts?{}:{status:'active'}).sort({createdAt:-1}).lean()));}
  const data=await local();return data.products.filter(p=>includeDrafts||p.status==='active');
}
export async function saveProduct(product:Product,id?:string){
  if(id&&id!==product.id)throw new Error('Product reference cannot be changed.');
  if(process.env.MONGODB_URI){await db();if(!id&&await ProductModel.exists({$or:[{id:product.id},{slug:product.slug}]}))throw new Error('A product with this reference or URL already exists.');return ProductModel.findOneAndUpdate({id:product.id},{$set:product},{new:true,upsert:!id,runValidators:true});}
  return mutate(data=>{if(data.products.some(p=>p.id!==product.id&&(p.slug===product.slug||p.variants.some(v=>product.variants.some(n=>n.sku===v.sku)))))throw new Error('Product URL and variant references must be unique.');const index=data.products.findIndex(p=>p.id===product.id);if(id&&index<0)throw new Error('Product not found.');if(!id&&index>=0)throw new Error('Product reference already exists.');if(index>=0)data.products[index]=product;else data.products.unshift(product);return product;});
}
export async function deleteProduct(id:string){
  if(process.env.MONGODB_URI){await db();return !!(await ProductModel.deleteOne({id})).deletedCount;}
  return mutate(data=>{const before=data.products.length;data.products=data.products.filter(p=>p.id!==id);return data.products.length<before;});
}
export async function siteSettings():Promise<SiteSettings>{
  if(process.env.MONGODB_URI){await db();const row=await Content.findOne({kind:'storefront',key:'site'}).lean() as {data:unknown}|null;return row?siteSettingsSchema.parse(row.data):structuredClone(defaultSiteSettings);}
  return (await local()).site;
}
export async function saveSiteSettings(site:SiteSettings){
  if(process.env.MONGODB_URI){await db();await Content.updateOne({kind:'storefront',key:'site'},{$set:{data:site}},{upsert:true});return site;}
  return mutate(data=>{data.site=site;return site;});
}
