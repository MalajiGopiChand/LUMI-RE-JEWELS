import {normalizeGoldQuote} from './gold-rate';
type CachedQuote={source:string;currency:string;unit:string;timestamp:number;rates:Record<string,number>};
export type GoldQuote={available:false;message:string}|({available:true;stale:boolean}&CachedQuote);
let cached:CachedQuote|null=null;let expires=0;let pending:Promise<void>|null=null;let failed=false;

async function fetchFromGoldApi():Promise<CachedQuote|null>{
  const token=process.env.GOLD_API_TOKEN;
  if(!token)return null;
  try{
    const r=await fetch('https://www.goldapi.io/api/XAU/INR',{
      headers:{'x-access-token':token},
      cache:'no-store',
      signal:AbortSignal.timeout(6000)
    });
    if(r.ok){
      const data=await r.json();
      return normalizeGoldQuote(data);
    }
  }catch{}
  return null;
}

async function fetchFromSpotMarket():Promise<CachedQuote|null>{
  try{
    const r=await fetch('https://api.gold-api.com/price/XAU/INR',{
      cache:'no-store',
      signal:AbortSignal.timeout(6000)
    });
    if(r.ok){
      const data=await r.json();
      if(typeof data.price==='number'&&data.price>0){
        const p24=Math.round((data.price/31.1034768)*100)/100;
        const p22=Math.round((p24*22/24)*100)/100;
        const p18=Math.round((p24*18/24)*100)/100;
        const p14=Math.round((p24*14/24)*100)/100;
        return {
          source:'Live Gold Market (Real-Time)',
          currency:'INR',
          unit:'gram',
          timestamp:Date.now(),
          rates:{'24K':p24,'22K':p22,'18K':p18,'14K':p14}
        };
      }
    }
  }catch{}
  return null;
}

export async function getGoldQuote():Promise<GoldQuote>{
  if(Date.now()>expires&&!pending){
    pending=(async()=>{
      try{
        let quote=await fetchFromGoldApi();
        if(!quote){
          quote=await fetchFromSpotMarket();
        }
        if(quote){
          cached=quote;
          failed=false;
          expires=Date.now()+180000; // cache for 3 minutes
        }else{
          failed=true;
          expires=Date.now()+30000;
        }
      }catch{
        failed=true;
        expires=Date.now()+30000;
      }finally{
        pending=null;
      }
    })();
  }
  if(pending)await pending;
  if(!cached)return {available:false,message:'Gold rates are temporarily unavailable. Please contact our boutique.'};
  return {available:true,...cached,stale:failed||Date.now()-cached.timestamp>900000};
}

