import {origin,limit,HttpError} from '@/lib/security';
export const runtime='nodejs';
export async function POST(req:Request){
  try{
    origin(req);await limit(req,'vision',20);
    if(!['image/jpeg','image/png','image/webp'].includes(req.headers.get('content-type')||''))throw new HttpError(400,'Choose a JPEG, PNG or WebP photo.');
    if(Number(req.headers.get('content-length')||0)>2*1024*1024)throw new HttpError(413,'Scan image must be under 2 MB.');
    const reader=req.body?.getReader();if(!reader)throw new HttpError(400,'Choose a photo to scan.');
    const chunks:Uint8Array[]=[];let size=0;
    while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>2*1024*1024){await reader.cancel();throw new HttpError(413,'Scan image must be under 2 MB.');}chunks.push(value);}
    if(!size)throw new HttpError(400,'Choose a photo to scan.');
    const result=await fetch('http://127.0.0.1:8765/analyze',{method:'POST',headers:{'Content-Type':req.headers.get('content-type')!,'X-Lumiere-Vision':'local-next'},body:Buffer.concat(chunks),signal:AbortSignal.timeout(30000),cache:'no-store'});
    return Response.json(await result.json(),{status:result.status,headers:{'Cache-Control':'no-store'}});
  }catch(e){return Response.json({error:e instanceof HttpError?e.message:'Python tracking is unavailable. Start Start-Python-Vision.cmd, or choose Browser face scan.'},{status:e instanceof HttpError?e.status:503,headers:{'Cache-Control':'no-store'}});}
}
