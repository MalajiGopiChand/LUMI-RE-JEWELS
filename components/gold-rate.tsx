'use client';
import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
import {whatsappUrl} from '@/lib/enquiry';
import {metalEstimate,jewelleryEstimate} from '@/lib/gold-pricing';
import {money,type Product} from '@/lib/catalogue';

export type Quote={available:boolean;message?:string;timestamp?:number;stale?:boolean;source?:string;rates?:Record<string,number>};
const Rates=createContext<Quote|null>(null);

export function GoldRateProvider({children}:{children:ReactNode}){
  const[q,setQ]=useState<Quote|null>(null);
  useEffect(()=>{
    let alive=true;
    const update=()=>fetch('/api/gold-rate')
      .then(r=>{if(!r.ok)throw new Error();return r.json()})
      .then(data=>{if(alive)setQ(data)})
      .catch(()=>{if(alive)setQ({available:false,message:'Live rates are temporarily unavailable.'})});
    void update();
    const timer=setInterval(()=>{if(!document.hidden)void update()},300000);
    const visible=()=>{if(!document.hidden)void update()};
    document.addEventListener('visibilitychange',visible);
    return()=>{alive=false;clearInterval(timer);document.removeEventListener('visibilitychange',visible)};
  },[]);
  return <Rates.Provider value={q}>{children}</Rates.Provider>;
}

export function useGoldRate(){
  return useContext(Rates);
}

export function GoldRate({compact=false}:{compact?:boolean}){
  const contextQ=useContext(Rates);
  const[localQ,setLocalQ]=useState<Quote|null>(null);

  useEffect(()=>{
    if(contextQ) return;
    let alive=true;
    const update=()=>fetch('/api/gold-rate')
      .then(r=>{if(!r.ok)throw new Error();return r.json()})
      .then(data=>{if(alive)setLocalQ(data)})
      .catch(()=>{if(alive)setLocalQ({available:false,message:'Rates are temporarily unavailable.'})});
    void update();
    const timer=setInterval(()=>{if(!document.hidden)void update()},300000);
    return()=>{alive=false;clearInterval(timer)};
  },[contextQ]);

  const q=contextQ||localQ;

  return (
    <section className={compact?'gold-rate gold-rate-compact':'gold-rate'} aria-label="Gold market rates">
      <div>
        <p className="eyebrow">GOLD MARKET · INR PER GRAM</p>
        {!compact&&<h2>Today’s reference rates.</h2>}
      </div>
      {q?.available? (
        <div>
          <div className="gold-rate-values">
            {Object.entries(q.rates||{}).map(([karat,value])=>(
              <div key={karat}>
                <small>{karat}</small>
                <strong>{new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(value)}</strong>
              </div>
            ))}
          </div>
          <p>{q.stale?'Last available quote':'Latest quote'} · {new Date(q.timestamp||Date.now()).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})} IST · {q.source||'GoldAPI.io'}</p>
          <small>Indicative metal value, excluding taxes, making charges and stones. Boutique prices may differ.</small>
        </div>
      ) : (
        <p role="status">{q?.message||'Checking gold rates…'}</p>
      )}
      <a className="text-link" href={whatsappUrl('Hello Carla Diamonds, please share today’s gold rate and jewellery pricing.')} target="_blank" rel="noopener noreferrer">
        Ask for a boutique quote
      </a>
    </section>
  );
}

export function SideGoldRate(){
  return null;
}

export function LivePrice({product}:{product:Product}){
  const q=useContext(Rates);
  const estimate=q?.available&&q.rates?jewelleryEstimate(product,q.rates):null;
  if(!estimate) return null;
  return (
    <p className="live-price" title="Dynamic price based on live gold market rate">
      <span className="live-dot" />
      <span>Live rate: <strong>{money(estimate.total)}</strong></span>
    </p>
  );
}

export function MetalEstimate({product}:{product:Product}){
  const q=useContext(Rates);
  const estimate=q?.available&&q.rates?jewelleryEstimate(product,q.rates):null;
  const metal=q?.available&&q.rates?metalEstimate(product,q.rates):null;
  return (
    <div className="metal-estimate">
      <div className="metal-estimate-head">
        <span className="live-dot" />
        <strong>Live Gold Market Pricing</strong>
      </div>
      {estimate ? (
        <>
          <dl className="estimate-breakdown">
            <dt>Gold · {product.weight || product.goldPricing?.netGoldWeight || 2.5}g net · {product.purity}</dt>
            <dd>{money(estimate.metal)}</dd>
            {estimate.stones > 0 && (
              <>
                <dt>Gemstones / Diamonds</dt>
                <dd>{money(estimate.stones)}</dd>
              </>
            )}
            <dt>Artisan Making Charges</dt>
            <dd>{money(estimate.making)}</dd>
            <dt>GST (3%)</dt>
            <dd>{money(estimate.tax)}</dd>
            <dt className="total-label">Real-time Estimated Total</dt>
            <dd className="total-value"><strong>{money(estimate.total)}</strong></dd>
          </dl>
          <small>
            {q?.stale ? 'Market quote' : 'Live spot quote'} · {new Date(q?.timestamp || Date.now()).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})} IST.
            Dynamically calculated from real-time gold market rates. Final price confirmed by our Vijayawada boutique.
          </small>
        </>
      ) : metal !== null ? (
        <>
          <p>{money(metal)} · {product.weight} g · {product.purity}</p>
          <small>Estimated net gold metal value based on today&apos;s live market rate.</small>
        </>
      ) : (
        <p>Live rate is currently updating. Ask our boutique for today’s exact quote.</p>
      )}
    </div>
  );
}
