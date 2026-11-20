import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {hasSupabase,supabaseServer,databaseError} from './supabase';
import {sampleProducts,type Product} from './catalogue';
import {defaultSiteSettings,siteSettingsSchema,type SiteSettings} from './site-settings';
type LocalStore={products:Product[];site:SiteSettings};
const directory=path.join(process.cwd(),'.data');
const file=path.join(directory,'boutique.json');
let queue:Promise<unknown>=Promise.resolve();
let initialization:Promise<void>|undefined;
async function initializeCatalogue(){
  if(!initialization)initialization=(async()=>{
    const {error}=await supabaseServer().rpc('carla_initialize_catalogue',{p_products:sampleProducts});databaseError(error);
  })().catch(error=>{initialization=undefined;throw error;});
  await initialization;
}
async function local():Promise<LocalStore>{
  try{return JSON.parse(await readFile(file,'utf8'));}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;return {products:structuredClone(sampleProducts),site:structuredClone(defaultSiteSettings)};}
}
async function mutate<T>(fn:(data:LocalStore)=>T):Promise<T>{
  if(process.env.NODE_ENV==='production')throw new Error('Database is not configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY to save live store updates.');
  const operation=queue.then(async()=>{const data=await local();const result=fn(data);await mkdir(directory,{recursive:true});const temp=file+'.'+randomUUID()+'.tmp';await writeFile(temp,JSON.stringify(data,null,2),'utf8');await rename(temp,file);return result;});
  queue=operation.catch(()=>undefined);return operation;
}
export async function catalogue(includeDrafts=false):Promise<Product[]>{
  if(hasSupabase()){await initializeCatalogue();let query=supabaseServer().from('carla_products').select('data').order('created_at',{ascending:false});if(!includeDrafts)query=query.eq('status','active');const {data,error}=await query;databaseError(error);return (data||[]).map(row=>row.data as Product);}
  const data=await local();return data.products.filter(p=>includeDrafts||p.status==='active');
}
export async function saveProduct(product:Product,id?:string){
  if(id&&id!==product.id)throw new Error('Product reference cannot be changed.');
  if(hasSupabase()){const {data,error}=await supabaseServer().rpc('carla_save_product',{p_product:product,p_existing_id:id||null});databaseError(error);return data as Product;}
  return mutate(data=>{if(data.products.some(p=>p.id!==product.id&&(p.slug===product.slug||p.variants.some(v=>product.variants.some(n=>n.sku===v.sku)))))throw new Error('Product URL and variant references must be unique.');const index=data.products.findIndex(p=>p.id===product.id);if(id&&index<0)throw new Error('Product not found.');if(!id&&index>=0)throw new Error('Product reference already exists.');if(index>=0)data.products[index]=product;else data.products.unshift(product);return product;});
}
export async function deleteProduct(id:string){
  if(hasSupabase()){const {data,error}=await supabaseServer().from('carla_products').delete().eq('id',id).select('id');databaseError(error);return !!data?.length;}
  return mutate(data=>{const before=data.products.length;data.products=data.products.filter(p=>p.id!==id);return data.products.length<before;});
}
export async function siteSettings():Promise<SiteSettings>{
  if(hasSupabase()){const {data,error}=await supabaseServer().from('carla_content').select('data').eq('kind','storefront').eq('key','site').maybeSingle();databaseError(error);return data?siteSettingsSchema.parse(data.data):structuredClone(defaultSiteSettings);}
  return (await local()).site;
}
export async function saveSiteSettings(site:SiteSettings){
  if(hasSupabase()){const {error}=await supabaseServer().from('carla_content').upsert({kind:'storefront',key:'site',data:site,updated_at:new Date().toISOString()});databaseError(error);return site;}
  return mutate(data=>{data.site=site;return site;});
}
