'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {ReelsGallery} from './reels-gallery';
import {ArrowRight,ArrowLeft,Pause,Play,X,Expand} from 'lucide-react';
import {carlaPhotos,type CarlaPhoto} from '@/lib/carla-media';
import {JewelleryImage} from './jewellery-image';
import {useSite,ManagedHero} from './site-content';
export function CarlaSlideshow(){
 const site=useSite(),slides=site.stories.filter(p=>p.enabled&&p.group==='campaign').map(p=>({id:p.id,src:p.image,title:p.title}));
 const[index,setIndex]=useState(0),[playing,setPlaying]=useState(true),[hover,setHover]=useState(false),[reduced,setReduced]=useState(true);
 useEffect(()=>{const mq=matchMedia('(prefers-reduced-motion: reduce)');const sync=()=>setReduced(mq.matches);sync();mq.addEventListener('change',sync);return()=>mq.removeEventListener('change',sync)},[]);
 useEffect(()=>{if(!playing||hover||reduced)return;const timer=setInterval(()=>{if(!document.hidden)setIndex(i=>(i+1)%slides.length)},5500);return()=>clearInterval(timer)},[playing,hover,reduced,slides.length]);
 if(!slides.length)return <ManagedHero content={{title:'Made to be remembered.',eyebrow:'CARLA DIAMONDS',description:'Fine jewellery, personal attention, and pieces to treasure.',body:'',image:'/images/editorial/campaign.jpg'}}/>;
 return <section className="carla-slideshow" aria-label="Carla Diamonds campaign slideshow" aria-roledescription="carousel" onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} onFocusCapture={()=>setHover(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget))setHover(false)}}><div className="campaign-copy"><p className="eyebrow">THE WORLD OF CARLA DIAMONDS</p><h1>Made to be<br/><em>remembered.</em></h1><p>For the moments that become your story. Discover our original jewellery collection, beautifully up close.</p><Link className="button light" href="/store-stories">Discover the collection <ArrowRight size={16}/></Link><Link className="campaign-visit" href="/contact">Visit our Vijayawada boutique <ArrowRight size={15}/></Link><div className="campaign-controls"><button aria-label="Previous slide" onClick={()=>setIndex(i=>(i+slides.length-1)%slides.length)}><ArrowLeft size={18}/></button><span>{String(index+1).padStart(2,'0')} / {String(slides.length).padStart(2,'0')}</span><button aria-label="Next slide" onClick={()=>setIndex(i=>(i+1)%slides.length)}><ArrowRight size={18}/></button><button aria-label={playing?'Pause slideshow':'Play slideshow'} onClick={()=>{setPlaying(!playing);setReduced(false)}}>{playing?<Pause size={16}/>:<Play size={16}/>}</button></div></div><div className="campaign-images">{slides.map((p,i)=><div key={p.id} className={'campaign-slide '+(index===i?'active':'')} aria-hidden={index!==i}><JewelleryImage src={p.src} alt={p.title} sizes="(max-width: 760px) 100vw, 50vw" loading={i===0?'eager':'lazy'} fetchPriority={i===0?'high':undefined}/></div>)}<div className="campaign-dots">{slides.map((p,i)=><button key={p.id} aria-label={'Show slide '+(i+1)} aria-current={i===index?'true':undefined} onClick={()=>setIndex(i)} />)}</div></div></section>
}
function PhotoViewer({photo,onClose}:{photo:CarlaPhoto;onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const el=dialog.current;el?.showModal();return()=>el?.close()},[]);
 return <dialog ref={dialog} className="carla-lightbox" onCancel={onClose} onClick={e=>{if(e.target===e.currentTarget)onClose()}}><button className="lightbox-close" onClick={onClose} aria-label="Close photograph"><X/></button><JewelleryImage src={photo.src} alt={photo.title} loading="eager" sizes="90vw"/><p>{photo.title}</p>{photo.description&&<p>{photo.description}</p>}</dialog>
}
export function InstagramGallery({featured=false}:{featured?:boolean}){
 const site=useSite(),managedPhotos:CarlaPhoto[]=site.stories.filter(p=>p.enabled).map(p=>({id:p.id,postId:'',src:p.image,title:p.title,description:p.description,group:p.group}));
 const[filter,setFilter]=useState('all'),[selected,setSelected]=useState<CarlaPhoto|null>(null);
 const photos=featured?managedPhotos.filter(p=>p.group==='collection').slice(0,6):managedPhotos.filter(p=>filter==='all'||p.group===filter);
 return <section className="section carla-photo-gallery" id="store-stories"><div className="section-heading"><div><p className="eyebrow">THE CARLA COLLECTION</p><h2>Extraordinary details.<br/><em>Beautifully yours.</em></h2><p className="social-intro">Original jewellery and photographs from our store.</p></div>{featured&&<Link className="text-link" href="/store-stories">Explore the complete gallery <ArrowRight size={16}/></Link>}</div>{!featured&&<div className="social-filters" aria-label="Filter photographs">{[['all','All photographs'],['collection','Jewellery'],['campaign','Campaigns'],['about','Our story']].map(([value,label])=><button key={value} aria-pressed={filter===value} onClick={()=>setFilter(value)}>{label}</button>)}<span>{photos.length} photographs</span></div>}<div className="carla-photo-grid">{photos.map(p=><button className="carla-photo-card" key={p.id} onClick={()=>setSelected(p)} aria-label={'View '+p.title}><div><JewelleryImage src={p.src} alt={p.title} sizes="(max-width: 760px) 45vw, 30vw"/><span><Expand size={17}/></span></div><h3>{p.title}</h3>{p.description&&<p>{p.description}</p>}<small>CARLA DIAMONDS</small></button>)}</div>{selected&&<PhotoViewer photo={selected} onClose={()=>setSelected(null)}/>}</section>
}
export function StoreStories(){
  const content=useSite().pages['store-stories'];
  return (
    <>
      <div className="page-title carla-page-title">
        <p className="eyebrow">{content?.eyebrow||'THE VIJAYAWADA BOUTIQUE · STORE STORIES & FILMS'}</p>
        <h1>{content?.title||'A closer look at Carla Diamonds.'}</h1>
        <p>{content?.description||'Step inside our world of fine jewellery. Explore our collection in motion, campaign portraits, and original store creations.'}</p>{content?.image&&<JewelleryImage className="managed-page-cover" src={content.image} alt={content.title}/ >}{content?.body&&<p className="managed-body">{content.body}</p>}
      </div>

      {/* Boutique Visit Banner */}
      <section className="boutique-spotlight" aria-label="Visit our boutique">
        <div className="boutique-spotlight-content">
          <p className="eyebrow">OUR FLAGSHIP BOUTIQUE</p>
          <h2>Experience the brilliance in person.</h2>
          <p>Located in Brindavan Colony, Vijayawada, our showroom showcases natural diamonds, certified hallmarked 22K & 18K gold, and bespoke bridal masterpieces.</p>
          <div className="boutique-spotlight-actions">
            <a className="button" href="https://maps.app.goo.gl/64YkeNiW1xZKoDz46" target="_blank" rel="noopener noreferrer">
              Get Directions on Maps ↗
            </a>
            <Link className="button outline" href="/contact">
              Plan Your Visit & Appointment <ArrowRight size={16}/>
            </Link>
          </div>
        </div>
      </section>

      {/* Autoplaying Reels Gallery */}
      <ReelsGallery/>

      {/* Photographic Editorial Gallery */}
      <InstagramGallery/>

      <section className="carla-closing">
        <h2>Find a piece that feels <em>like you.</em></h2>
        <p>Speak directly with our jewellery designers and master craftsmen on WhatsApp.</p>
        <Link className="button" href="/contact">Speak with our boutique <ArrowRight size={16}/></Link>
      </section>
    </>
  );
}

