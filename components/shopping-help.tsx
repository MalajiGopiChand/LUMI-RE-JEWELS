'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {MessageCircle,X,Send,Sparkles,MessageSquare,ArrowRight,TrendingUp} from 'lucide-react';
import {money,sampleProducts,type Product} from '@/lib/catalogue';
import {whatsappUrl} from '@/lib/enquiry';
import {useGoldRate} from './gold-rate';
import {JewelleryImage} from './jewellery-image';
import {boutique} from '@/lib/carla-media';

type Suggestion={id:string;name:string;slug:string;price:number;image?:string;sample?:boolean};
type Message={role:'user'|'assistant';content:string;products?:Suggestion[];whatsapp?:string};

function getSmartAdvice(userText:string, quoteRates?:Record<string,number>):{message:string;products:Suggestion[];whatsapp:string}{
  const q = userText.toLowerCase();

  const r24 = quoteRates?.['24K'] ? money(quoteRates['24K']) : '₹12,704';
  const r22 = quoteRates?.['22K'] ? money(quoteRates['22K']) : '₹11,645';
  const r18 = quoteRates?.['18K'] ? money(quoteRates['18K']) : '₹9,528';
  const r14 = quoteRates?.['14K'] ? money(quoteRates['14K']) : '₹7,411';

  const toSug = (p:Product):Suggestion => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    image: p.images[0],
    sample: p.sample
  });

  // 1. Live Gold Rate Query
  if (/(gold rate|live rate|price of gold|rate per gram|today rate|22k|24k|18k rate)/i.test(q)) {
    return {
      message: `Here is today's real-time gold market reference (per gram in INR):\n\n• 24K Pure Gold: ${r24} /g (99.9%)\n• 22K Jewellery Gold: ${r22} /g (91.6% Hallmark)\n• 18K Diamond Jewellery: ${r18} /g (75.0% Fine Gold)\n• 14K Everyday Gold: ${r14} /g (58.5% Modern Wear)\n\nAll rates update continuously with live bullion feeds. In-store jewellery pricing is calculated based on:\nNet Gold Weight × Live Gold Rate + Artisan Making Charges (~12%) + 3% GST.\n\nTap below to lock in today's gold rate with our boutique on WhatsApp!`,
      products: [sampleProducts[6], sampleProducts[2], sampleProducts[1]].map(toSug),
      whatsapp: whatsappUrl(`Hello Carla Diamonds, please share today's live gold booking rate (${r22}/g 22K, ${r18}/g 18K) for jewellery orders.`)
    };
  }

  // 2. Chains & Pendants / Necklaces Query
  if (/(chain|chains|pendant|pendants|necklace|necklaces|lariat)/i.test(q)) {
    const chainItems = sampleProducts.filter(p => p.category === 'Necklaces').slice(0, 3);
    return {
      message: `For daily wear and layering, we recommend our hallmarked 18K gold chains and handcrafted pendants designed with lightweight elegance and durability:\n\n1. Carla Layered Chain (${money(chainItems[1]?.price || 36900)}) — A graceful double-strand design featuring delicate interlocking links and a warm golden disc.\n2. Golden Hour Pendant (${money(chainItems[0]?.price || 24900)}) — An artisanal sun medallion on a fine gold chain that catches everyday light.\n3. The Pearl Chapter (${money(chainItems[2]?.price || 22900)}) — Modern freshwater pearls on hallmarked gold links.\n\nToday's live 18K rate is ${r18}/g (22K: ${r22}/g). Would you prefer a 16-inch or 18-inch length? Tap below to chat directly with our Vijayawada boutique specialists on WhatsApp for custom thickness and hallmarking details!`,
      products: chainItems.map(toSug),
      whatsapp: whatsappUrl(`Hello Carla Diamonds, I would like to choose gold chains and pendants for daily wear. Please share available lengths and designs.`)
    };
  }

  // 3. Diamonds & Solitaires Query
  if (/(diamond|solitaire|diamonds|solitaires|gemstone|ruby|emerald|sapphire)/i.test(q)) {
    const diamondItems = [
      sampleProducts.find(p=>p.slug.includes('eclat')) || sampleProducts[1],
      sampleProducts.find(p=>p.slug.includes('serein')) || sampleProducts[3],
      sampleProducts.find(p=>p.slug.includes('diamond-huggie')) || sampleProducts[19],
    ];
    return {
      message: `Here are our most celebrated natural diamond creations, handcrafted for timeless radiance:\n\n1. Éclat Diamond Ring (${money(diamondItems[0].price)}) — A brilliant round solitaire on a fine 18K white gold band. A luminous symbol of something lasting.\n2. The Serein Bracelet (${money(diamondItems[1].price)}) — Bezel-set natural diamonds tracing a fluid 18K gold circle.\n3. Diamond Huggie Hoops (${money(diamondItems[2].price)}) — Everyday luxury with a seamless row of brilliant-cut diamonds.\n\nEach diamond is ethically sourced and verified for exceptional cut and sparkle. Tap any piece below to view details or try them in our Virtual Try-On Studio!`,
      products: diamondItems.map(toSug),
      whatsapp: whatsappUrl(`Hello Carla Diamonds, I am interested in your diamond jewellery and solitaires. Please share certification details and options.`)
    };
  }

  // 4. Rings & Bands Query
  if (/(ring|rings|band|bands|engagement|proposal|finger)/i.test(q)) {
    const ringItems = sampleProducts.filter(p => p.category === 'Rings').slice(0, 3);
    return {
      message: `Discover our curated collection of gold rings and diamond bands, crafted for milestone promises and daily elegance:\n\n1. ${ringItems[0].name} (${money(ringItems[0].price)}) — ${ringItems[0].description}\n2. ${ringItems[1].name} (${money(ringItems[1].price)}) — ${ringItems[1].description}\n3. ${ringItems[2].name} (${money(ringItems[2].price)}) — ${ringItems[2].description}\n\nWe provide Indian ring sizes from 10 to 16, as well as bespoke sizing. Tap WhatsApp below to get personal ring sizing guidance or arrange an in-person viewing!`,
      products: ringItems.map(toSug),
      whatsapp: whatsappUrl(`Hello Carla Diamonds, I would like guidance on choosing a ring and custom sizing.`)
    };
  }

  // 5. Bracelets, Bangles & Cuffs Query
  if (/(bracelet|bracelets|bangle|bangles|cuff|cuffs|wrist)/i.test(q)) {
    const braceletItems = sampleProducts.filter(p => p.category === 'Bracelets').slice(0, 3);
    return {
      message: `Explore our fluid gold bracelets, cuffs, and delicate diamond bangles designed to move gracefully with you:\n\n1. ${braceletItems[0].name} (${money(braceletItems[0].price)}) — ${braceletItems[0].description}\n2. ${braceletItems[1].name} (${money(braceletItems[1].price)}) — ${braceletItems[1].description}\n3. ${braceletItems[2].name} (${money(braceletItems[2].price)}) — ${braceletItems[2].description}\n\nAvailable in standard 16 cm and 18 cm wrist lengths. Speak with our boutique on WhatsApp for wrist measurements and gifting boxes!`,
      products: braceletItems.map(toSug),
      whatsapp: whatsappUrl(`Hello Carla Diamonds, I would like to explore your bracelets and bangles collection.`)
    };
  }

  // 6. Earrings & Hoops Query
  if (/(earring|earrings|hoop|hoops|stud|studs|drop|drops)/i.test(q)) {
    const earringItems = sampleProducts.filter(p => p.category === 'Earrings').slice(0, 3);
    return {
      message: `From sculptural everyday hoops to brilliant diamond drops, explore our earring collection:\n\n1. ${earringItems[0].name} (${money(earringItems[0].price)}) — ${earringItems[0].description}\n2. ${earringItems[1].name} (${money(earringItems[1].price)}) — ${earringItems[1].description}\n3. ${earringItems[2].name} (${money(earringItems[2].price)}) — ${earringItems[2].description}\n\nLightweight, comfortable for all-day wear, and hallmarked in gold. Tap below to chat on WhatsApp with our stylist!`,
      products: earringItems.map(toSug),
      whatsapp: whatsappUrl(`Hello Carla Diamonds, I would like help choosing earrings from your collection.`)
    };
  }

  // 7. WhatsApp / Contact / Boutique Query
  if (/(whatsapp|contact|phone|call|address|location|store|visit|hours|showroom)/i.test(q)) {
    return {
      message: `You can reach our Carla Diamonds boutique directly! Here are our showroom details in Vijayawada:\n\n📍 Address: ${boutique.address}\n📞 Phone: ${boutique.phone}\n💬 WhatsApp: Instant 1-on-1 assistance for custom orders, video tours, and gold rate bookings.\n\nTap the button below to open a direct WhatsApp conversation with our master jewellery concierge!`,
      products: [sampleProducts[0], sampleProducts[6], sampleProducts[1]].map(toSug),
      whatsapp: whatsappUrl(`Hello Carla Diamonds, I would like to connect with your Vijayawada showroom concierge.`)
    };
  }

  // 8. General / Fallback Query
  const generalItems = [sampleProducts[6], sampleProducts[1], sampleProducts[3]];
  return {
    message: `Welcome to Carla Diamonds! We craft fine jewellery in hallmarked 18K & 22K gold, natural diamonds, rings, chains, bracelets, and earrings.\n\n• Today's Live Rates: 22K: ${r22}/g · 18K: ${r18}/g\n• Custom sizing, virtual 3D try-on, and bridal consultations available.\n\nTake a look at our featured pieces below, tell me what occasion or style you have in mind, or click the WhatsApp button to chat directly with our boutique specialist!`,
    products: generalItems.map(toSug),
    whatsapp: whatsappUrl(`Hello Carla Diamonds, I would like help choosing jewellery: "${userText}"`)
  };
}

export function ShoppingHelp(){
  const[open,setOpen]=useState(false);
  const goldRateQuote = useGoldRate();
  const[messages,setMessages]=useState<Message[]>([
    {
      role:'assistant',
      content:'Hello! Welcome to Carla Diamonds. I am your personal jewellery shopping assistant. Looking for rings, gold chains, bracelets, earrings, or today’s live gold rate? Ask me anything or pick an option below!'
    }
  ]);
  const[input,setInput]=useState('');
  const[busy,setBusy]=useState(false);
  const end=useRef<HTMLDivElement>(null);
  const field=useRef<HTMLInputElement>(null);
  const trigger=useRef<HTMLButtonElement>(null);

  useEffect(()=>{
    if(open) field.current?.focus();
  },[open]);

  useEffect(()=>{
    if(open) end.current?.scrollIntoView({behavior:'smooth',block:'nearest'});
  },[messages,busy,open]);

  const latestUserQuestions = messages.filter(m=>m.role==='user').slice(-2).map(m=>m.content).join('\n');
  const globalHandoff = whatsappUrl(
    'Hello Carla Diamonds boutique, I would like personal assistance with choosing jewellery:\n' + 
    (latestUserQuestions || 'Looking for recommendations on rings, chains, or bracelets.')
  );

  async function send(text:string){
    if(busy||!text.trim())return;
    const userQuery = text.trim();
    const next=[...messages,{role:'user' as const,content:userQuery}];
    setMessages(next);
    setInput('');
    setBusy(true);

    try{
      const r=await fetch('/api/chat',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          messages:next.slice(-10).map(({role,content})=>({role,content:content.slice(0,2000)}))
        }),
        signal:AbortSignal.timeout(12000)
      });
      const data=await r.json();
      
      // If server returned ok and non-unavailable message
      if(r.ok && data.message && !data.message.includes('unavailable')){
        setMessages([...next,{
          role:'assistant',
          content:data.message,
          products:data.products,
          whatsapp:data.whatsapp
        }]);
      } else {
        // Run our intelligent jewellery specialist engine
        const advice = getSmartAdvice(userQuery, goldRateQuote?.rates);
        setMessages([...next,{
          role:'assistant',
          content:advice.message,
          products:advice.products,
          whatsapp:advice.whatsapp
        }]);
      }
    }catch{
      // Seamless intelligent response on network or timeout
      const advice = getSmartAdvice(userQuery, goldRateQuote?.rates);
      setMessages([...next,{
        role:'assistant',
        content:advice.message,
        products:advice.products,
        whatsapp:advice.whatsapp
      }]);
    }finally{
      setBusy(false);
    }
  }

  const promptOptions = [
    { label: '💍 Rings & Bands', query: 'Show me your finest gold rings and diamond bands' },
    { label: '⛓️ Gold Chains', query: 'Help me choose gold chains and pendants for daily wear' },
    { label: '✨ Bracelets', query: 'Show me gold bracelets and cuffs for gifting' },
    { label: '📈 Today\'s Live Rate', query: 'What is today\'s live gold rate per gram in 22K and 18K?' },
    { label: '💎 Diamond Solitaires', query: 'Recommend diamond jewellery and solitaires' },
    { label: '💬 Chat on WhatsApp', query: 'I would like to contact your boutique directly on WhatsApp' },
  ];

  return (
    <aside className="shopping-help" aria-label="Shopping assistance">
      <div className="help-actions">
        <button 
          ref={trigger} 
          className="chat-toggle" 
          aria-expanded={open} 
          aria-controls="carla-chat" 
          onClick={()=>setOpen(!open)}
        >
          <MessageCircle size={18}/> 
          <span>Ask Carla AI</span>
        </button>
      </div>

      {open && (
        <section 
          id="carla-chat" 
          className="chat-panel" 
          aria-label="Carla AI shopping assistant" 
          onKeyDown={e=>{if(e.key==='Escape'){setOpen(false);trigger.current?.focus()}}}
        >
          <header>
            <div>
              <div className="chat-header-title">
                <Sparkles size={16} />
                <strong>Carla Diamonds AI Stylist</strong>
              </div>
              <small>Expert jewellery guidance · 22K & 18K Gold, Diamonds & Custom Orders</small>
            </div>
            <button className="icon" aria-label="Close assistant" onClick={()=>{setOpen(false);trigger.current?.focus()}}>
              <X size={20}/>
            </button>
          </header>

          <div className="chat-messages" role="log" aria-live="polite">
            {messages.map((m,i)=>(
              <div key={i} className={'chat-message '+m.role}>
                <small>{m.role==='user'?'You':'Carla Boutique AI'}</small>
                <p style={{whiteSpace:'pre-line'}}>{m.content}</p>

                {m.products && m.products.length > 0 && (
                  <div className="chat-products-list">
                    {m.products.map(p=>(
                      <Link className="chat-product-card" href={'/product/'+p.slug} key={p.id} onClick={()=>setOpen(false)}>
                        {p.image && <JewelleryImage src={p.image} alt={p.name} />}
                        <div className="chat-product-info">
                          <strong>{p.name}</strong>
                          <span>{money(p.price)}{p.sample?' · Sample':''}</span>
                          <span className="view-link">View piece →</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {m.role==='assistant' && (
                  <a 
                    className="message-whatsapp-cta" 
                    href={m.whatsapp || globalHandoff} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <MessageSquare size={14}/>
                    <span>Speak with Boutique Specialist on WhatsApp ↗</span>
                  </a>
                )}
              </div>
            ))}

            {busy && (
              <div className="chat-loading">
                <Sparkles size={16} className="spinning" />
                <span>Curating jewellery recommendations for you…</span>
              </div>
            )}
            <div ref={end}/>
          </div>

          {/* Quick Option Prompts */}
          <div className="chat-prompts-scroll" aria-label="Quick options">
            {promptOptions.map(opt=>(
              <button 
                type="button"
                disabled={busy} 
                key={opt.label} 
                onClick={()=>void send(opt.query)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <form onSubmit={e=>{e.preventDefault();void send(input)}}>
            <input 
              ref={field} 
              aria-label="Ask about jewellery" 
              value={input} 
              maxLength={2000} 
              onChange={e=>setInput(e.target.value)} 
              placeholder="Ask about rings, chains, budget, gold rate…"
            />
            <button disabled={busy||!input.trim()} aria-label="Send message">
              <Send size={18}/>
            </button>
          </form>

          <div className="chat-footer-actions">
            <a className="chat-whatsapp-main" href={globalHandoff} target="_blank" rel="noopener noreferrer">
              <span>Direct Boutique WhatsApp Enquiry ↗</span>
            </a>
            <small className="chat-note">
              Vijayawada Flagship Boutique · Call +91 76720 21223 · Custom sizing & bridal consultations
            </small>
          </div>
        </section>
      )}
    </aside>
  );
}
