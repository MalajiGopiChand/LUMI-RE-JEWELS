'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {MessageCircle,X,Send,Sparkles,MessageSquare,ArrowRight} from 'lucide-react';
import {money} from '@/lib/catalogue';
import {whatsappUrl} from '@/lib/enquiry';
import {JewelleryImage} from './jewellery-image';

type Suggestion={id:string;name:string;slug:string;price:number;image?:string;sample?:boolean};
type Message={role:'user'|'assistant';content:string;products?:Suggestion[];whatsapp?:string};

export function ShoppingHelp(){
  const[open,setOpen]=useState(false);
  const[messages,setMessages]=useState<Message[]>([
    {
      role:'assistant',
      content:'Hello! Welcome to Carla Diamonds. I am your personal jewellery shopping assistant. Looking for rings, gold chains, bracelets, earrings, or today’s live gold rate? Ask me anything or pick an option below!'
    }
  ]);
  const[input,setInput]=useState('');
  const[busy,setBusy]=useState(false);
  const[error,setError]=useState('');
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
    const next=[...messages,{role:'user' as const,content:text.trim()}];
    setMessages(next);
    setInput('');
    setBusy(true);
    setError('');

    try{
      const r=await fetch('/api/chat',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          messages:next.slice(-10).map(({role,content})=>({role,content:content.slice(0,2000)}))
        }),
        signal:AbortSignal.timeout(20000)
      });
      const data=await r.json();
      if(!r.ok) throw new Error(data.error||'Could not get a response. Please try again or use WhatsApp.');
      setMessages([...next,{
        role:'assistant',
        content:data.message,
        products:data.products,
        whatsapp:data.whatsapp
      }]);
    }catch(e){
      // Graceful fallback with direct WhatsApp link
      setError('');
      setMessages([...next,{
        role:'assistant',
        content:`I'm here to help with your jewellery questions! For custom sizing, gold weight enquiries, or immediate booking, our Vijayawada boutique specialists are ready to guide you on WhatsApp.`,
        whatsapp:whatsappUrl(`Hello Carla Diamonds, I have a question regarding: "${text}"`)
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
                <p>{m.content}</p>

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
                <span>Finding the perfect jewellery options for you…</span>
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

          {error && <p className="chat-error" role="alert">{error}</p>}

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
              Boutique in Vijayawada · Call +91 76720 21223 · Custom sizing & bridal consultations available
            </small>
          </div>
        </section>
      )}
    </aside>
  );
}
