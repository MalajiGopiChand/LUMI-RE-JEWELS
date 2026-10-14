import {normalizeGoldQuote} from '@/lib/gold-rate';
export const runtime='nodejs';
export const dynamic='force-dynamic';
let cached:ReturnType<typeof normalizeGoldQuote>|null=null;let expires=0;let pending:Promise<void>|null=null;
export async function GET(){
 if(!process.env.GOLD_API_TOKEN)return Response.json({available:false,message:'Live gold rates are not connected. Ask our boutique for today’s quote.'});
 if(Date.now()>expires){if(!pending)pending=(async()=>{expires=Date.now()+60000;try{const r=await fetch('https://www.goldapi.io/api/XAU/INR',{headers:{'x-access-token':process.env.GOLD_API_TOKEN!},cache:'no-store',signal:AbortSignal.timeout(8000)});if(!r.ok)throw new Error('Provider unavailable');cached=normalizeGoldQuote(await r.json());expires=Date.now()+300000;}catch{}finally{pending=null}})();await pending;}
 if(!cached)return Response.json({available:false,message:'Gold rates are temporarily unavailable. Please contact our boutique.'});
 return Response.json({available:true,...cached,stale:Date.now()-cached.timestamp>900000},{headers:{'Cache-Control':'no-store'}});
}
