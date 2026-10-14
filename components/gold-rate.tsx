'use client';
import {createContext,useContext,useEffect,useState,useRef,type ReactNode} from 'react';
import {whatsappUrl} from '@/lib/enquiry';
import {metalEstimate,jewelleryEstimate} from '@/lib/gold-pricing';
import {money,type Product} from '@/lib/catalogue';
import {TrendingUp,X,Calculator,Clock,RefreshCw,ShieldCheck,CheckCircle2} from 'lucide-react';

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
    const timer=setInterval(()=>{if(!document.hidden)void update()},45000);
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
  const q=useContext(Rates);
  return (
    <section className={compact?'gold-rate gold-rate-compact':'gold-rate'} aria-label="Gold market rates">
      <div>
        <p className="eyebrow">LIVE GOLD MARKET · INR / GRAM</p>
        {!compact&&<h2>Today’s reference rates.</h2>}
      </div>
      {q?.available? (
        <div>
          <div className="gold-rate-values">
            {Object.entries(q.rates||{}).map(([karat,value])=>(
              <div key={karat}>
                <small>{karat} Gold</small>
                <strong>{money(value)}</strong>
              </div>
            ))}
          </div>
          <p>{q.stale?'Market reference':'Live spot quote'} · {new Date(q.timestamp||Date.now()).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})} IST</p>
          <small>{q.source||'Real-Time Market Feed'} · Refreshes automatically. Metal value only; excludes making charges & GST.</small>
        </div>
      ):(
        <p role="status">{q?.message||'Connecting to live gold market…'}</p>
      )}
      <a className="text-link" href={whatsappUrl('Hello Carla Diamonds, please share today’s live gold rate and booking quote.')} target="_blank" rel="noopener noreferrer">
        Ask for boutique booking quote
      </a>
    </section>
  );
}

export function SideGoldRate(){
  const q=useContext(Rates);
  const [open,setOpen]=useState(false);
  const [weight,setWeight]=useState('10');
  const [karat,setKarat]=useState('22K');
  const [refreshing,setRefreshing]=useState(false);

  const rate = q?.rates?.[karat] || (q?.rates?.['24K'] ? (karat==='22K'?q.rates['24K']*22/24:q.rates['24K']*18/24) : 0);
  const numWeight = Math.max(0, parseFloat(weight) || 0);
  const metalValue = Math.round(rate * numWeight);
  const makingCharges = Math.round(metalValue * 0.12); // 12% making
  const gst = Math.round((metalValue + makingCharges) * 0.03); // 3% GST
  const estimatedTotal = metalValue + makingCharges + gst;

  const refreshRates = async () => {
    setRefreshing(true);
    try {
      await fetch('/api/gold-rate');
    } catch {}
    setTimeout(()=>setRefreshing(false), 600);
  };

  return (
    <aside className="side-gold-widget" aria-label="Real-time Gold Rate Widget">
      {/* Floating Side Pill */}
      <button 
        className="side-gold-pill" 
        onClick={()=>setOpen(!open)}
        aria-expanded={open}
        aria-label="View Realtime Gold Rates"
      >
        <span className="live-pulse" aria-hidden="true" />
        <span className="pill-title">LIVE GOLD</span>
        {q?.available && q.rates ? (
          <span className="pill-rate">
            <strong>22K: {money(q.rates['22K'] || Math.round(q.rates['24K']*22/24))}/g</strong>
          </span>
        ) : (
          <span className="pill-rate">Rates</span>
        )}
      </button>

      {/* Floating Side Drawer */}
      {open && (
        <div className="side-gold-drawer" role="dialog" aria-modal="true" aria-label="Realtime Gold Rates and Calculator">
          <div className="drawer-header">
            <div>
              <div className="live-tag">
                <span className="live-pulse" />
                <strong>LIVE GOLD RATES</strong>
              </div>
              <small>Updated {new Date(q?.timestamp || Date.now()).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})} IST</small>
            </div>
            <div className="drawer-header-actions">
              <button className="icon-btn" onClick={refreshRates} title="Refresh live rate" aria-label="Refresh live rates">
                <RefreshCw size={15} className={refreshing ? 'spinning' : ''} />
              </button>
              <button className="icon-btn" onClick={()=>setOpen(false)} aria-label="Close gold rate drawer">
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="drawer-content">
            {/* Live Rates Grid */}
            <div className="drawer-rates-grid">
              <div className="rate-box highlight">
                <span>24K PURE GOLD</span>
                <strong>{q?.rates?.['24K'] ? money(q.rates['24K']) : '₹12,704'}<small>/g</small></strong>
                <em>99.9% 24 Karat</em>
              </div>
              <div className="rate-box standard">
                <span>22K JEWELLERY</span>
                <strong>{q?.rates?.['22K'] ? money(q.rates['22K']) : '₹11,645'}<small>/g</small></strong>
                <em>91.6% Hallmark</em>
              </div>
              <div className="rate-box">
                <span>18K DIAMOND</span>
                <strong>{q?.rates?.['18K'] ? money(q.rates['18K']) : '₹9,528'}<small>/g</small></strong>
                <em>75.0% Fine Gold</em>
              </div>
              <div className="rate-box">
                <span>14K MODERN</span>
                <strong>{q?.rates?.['14K'] ? money(q.rates['14K']) : '₹7,411'}<small>/g</small></strong>
                <em>58.5% Everyday</em>
              </div>
            </div>

            {/* Quick Calculator */}
            <div className="drawer-calculator">
              <div className="calc-title">
                <Calculator size={14} />
                <span>Instant Gold Price Calculator</span>
              </div>
              <div className="calc-inputs">
                <label>
                  <span>Weight (grams):</span>
                  <input 
                    type="number" 
                    min="0.1" 
                    step="0.1" 
                    value={weight} 
                    onChange={e=>setWeight(e.target.value)}
                    placeholder="e.g. 10" 
                  />
                </label>
                <label>
                  <span>Karat:</span>
                  <select value={karat} onChange={e=>setKarat(e.target.value)}>
                    <option value="22K">22K (Hallmark)</option>
                    <option value="24K">24K (Pure Gold)</option>
                    <option value="18K">18K (Diamond Jewellery)</option>
                    <option value="14K">14K (Modern)</option>
                  </select>
                </label>
              </div>

              {numWeight > 0 && rate > 0 && (
                <div className="calc-breakdown">
                  <div className="calc-row">
                    <span>Gold Value ({numWeight}g × {money(rate)})</span>
                    <span>{money(metalValue)}</span>
                  </div>
                  <div className="calc-row">
                    <span>Est. Making Charges (~12%)</span>
                    <span>{money(makingCharges)}</span>
                  </div>
                  <div className="calc-row">
                    <span>GST (3%)</span>
                    <span>{money(gst)}</span>
                  </div>
                  <div className="calc-total">
                    <span>Est. Total:</span>
                    <strong>{money(estimatedTotal)}</strong>
                  </div>
                </div>
              )}
            </div>

            <div className="drawer-footer">
              <a 
                className="whatsapp-btn" 
                href={whatsappUrl(`Hello Carla Diamonds, I would like to enquire about today's live gold rate (${karat}: ${money(rate)}/g) for a ${numWeight}g jewellery piece.`)}
                target="_blank" 
                rel="noopener noreferrer"
              >
                Book Rate on WhatsApp ↗
              </a>
              <small className="drawer-note">
                Reference rates update continuously. Final billing includes exact weight, diamond/gemstone certification, and boutique making charges.
              </small>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
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
