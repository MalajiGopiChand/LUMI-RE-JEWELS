import {NextResponse} from 'next/server';
import {randomUUID} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {GridFSBucket,ObjectId} from 'mongodb';
import mongoose from 'mongoose';
import {admin,HttpError} from './security';
import {db} from './db';
import {catalogue,saveProduct,deleteProduct,siteSettings,saveSiteSettings} from './admin-store';
import {siteSettingsSchema} from './site-settings';
import {productSchema} from './validation';
const json=(data:unknown,status=200)=>NextResponse.json(data,{status});
const mediaDir=path.join(process.cwd(),'.data','media');
export async function managedAdmin(req:Request,parts:string[]){
  await admin();const [resource,id]=parts;
  if(resource==='products'){
    if(req.method==='GET')return json(await catalogue(true));
    if(req.method==='DELETE'){if(!id)throw new HttpError(400,'Select a product to delete.');if(!await deleteProduct(id))throw new HttpError(404,'Product not found.');return json({ok:true});}
    if(!['POST','PATCH'].includes(req.method))throw new HttpError(405,'Method not allowed.');
    const value=productSchema.parse(await req.json());const result=await saveProduct(value,id);if(!result)throw new HttpError(404,'Product not found.');return json(result,req.method==='POST'?201:200);
  }
  if(resource==='site'){
    if(req.method==='GET')return json(await siteSettings());
    if(req.method!=='PATCH')throw new HttpError(405,'Method not allowed.');
    const text=await req.text();if(text.length>1000000)throw new HttpError(413,'Content is too large.');
    return json(await saveSiteSettings(siteSettingsSchema.parse(JSON.parse(text))));
  }
  if(resource==='overview'&&req.method==='GET'){
    const products=await catalogue(true);return json({products:products.length,published:products.filter(p=>p.status==='active').length,drafts:products.filter(p=>p.status==='draft').length,storage:process.env.MONGODB_URI?'database':'local',uploads:!!process.env.MONGODB_URI||process.env.NODE_ENV!=='production'});
  }
  if(resource==='media'&&req.method==='POST'){
    if(Number(req.headers.get('content-length')||0)>4.5*1024*1024)throw new HttpError(413,'Choose an image under 4 MB.');
    const file=(await req.formData()).get('file');
    if(!(file instanceof File)||file.size>4*1024*1024||!file.size)throw new HttpError(400,'Choose an image under 4 MB.');
    const bytes=Buffer.from(await file.arrayBuffer());
    const mime=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?'image/png':bytes[0]===255&&bytes[1]===216&&bytes[2]===255?'image/jpeg':bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP'?'image/webp':null;
    if(!mime||mime!==file.type)throw new HttpError(400,'Only valid JPEG, PNG and WebP images are accepted.');
    let id:string;
    if(process.env.MONGODB_URI){await db();const bucket=new GridFSBucket(mongoose.connection.db!,{bucketName:'boutiqueMedia'});const upload=bucket.openUploadStream(file.name,{metadata:{contentType:mime}});await new Promise<void>((resolve,reject)=>{upload.on('finish',()=>resolve());upload.on('error',reject);upload.end(bytes);});id=upload.id.toHexString();}
    else{if(process.env.NODE_ENV==='production')throw new HttpError(503,'Set MONGODB_URI to enable durable image uploads on the live website.');id=randomUUID();await mkdir(mediaDir,{recursive:true});await writeFile(path.join(mediaDir,id),bytes);await writeFile(path.join(mediaDir,id+'.json'),JSON.stringify({mime}));}
    return json({url:'/api/media/'+id,secure_url:'/api/media/'+id},201);
  }
  throw new HttpError(404,'Admin endpoint not found.');
}
export async function mediaResponse(id:string){
  if(!/^(?:[a-f\d]{24}|[a-f\d-]{36})$/.test(id))throw new HttpError(404,'Image not found.');
  let bytes:Buffer,mime:string;
  if(process.env.MONGODB_URI){await db();if(!ObjectId.isValid(id))throw new HttpError(404,'Image not found.');const bucket=new GridFSBucket(mongoose.connection.db!,{bucketName:'boutiqueMedia'});const files=await bucket.find({_id:new ObjectId(id)}).toArray();if(!files[0])throw new HttpError(404,'Image not found.');mime=String(files[0].metadata?.contentType||'image/jpeg');const chunks:Buffer[]=[];for await(const chunk of bucket.openDownloadStream(new ObjectId(id)))chunks.push(Buffer.from(chunk));bytes=Buffer.concat(chunks);}
  else{try{bytes=await readFile(path.join(mediaDir,id));mime=JSON.parse(await readFile(path.join(mediaDir,id+'.json'),'utf8')).mime;}catch{throw new HttpError(404,'Image not found.');}}
  return new NextResponse(new Uint8Array(bytes),{headers:{'Content-Type':mime,'Cache-Control':'public, max-age=31536000, immutable','X-Content-Type-Options':'nosniff'}});
}
