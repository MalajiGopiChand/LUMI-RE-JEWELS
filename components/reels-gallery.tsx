'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {ArrowRight,Play,Pause,Volume2,VolumeX,Sparkles} from 'lucide-react';
import {JewelleryImage} from './jewellery-image';
import {storePosts} from '@/lib/instagram';

const reels=storePosts.filter(p=>p.kind==='reel');

export function StoreFilm({id,title}:{id:string;title:string}){
  const video=useRef<HTMLVideoElement>(null);
  const[isPlaying,setIsPlaying]=useState(true);
  const[isMuted,setIsMuted]=useState(true);
  const[failed,setFailed]=useState(false);

  useEffect(()=>{
    const el=video.current;
    if(!el)return;
    const observer=new IntersectionObserver(([entry])=>{
      if(entry.isIntersecting && !document.hidden){
        el.play().then(()=>{
          setIsPlaying(true);
        }).catch(()=>{
          // If browser policy requires user interaction for sound, muted autoplay will work
          el.muted = true;
          el.play().catch(()=>{});
        });
      }else{
        el.pause();
        setIsPlaying(false);
      }
    },{threshold:0.25});
    observer.observe(el);

    const handleVisibility=()=>{
      if(document.hidden){
        el.pause();
      }
    };
    document.addEventListener('visibilitychange',handleVisibility);

    return ()=>{
      observer.disconnect();
      document.removeEventListener('visibilitychange',handleVisibility);
    };
  },[]);

  const togglePlay=()=>{
    const el=video.current;
    if(!el)return;
    if(el.paused){
      el.play().catch(()=>{});
      setIsPlaying(true);
    }else{
      el.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute=()=>{
    const el=video.current;
    if(!el)return;
    el.muted = !el.muted;
    setIsMuted(el.muted);
  };

  return (
    <article className="carla-film" id={'film-'+id}>
      <div className="film-media-wrapper">
        <video 
          ref={video} 
          src={'/videos/carla/'+id+'.mp4'} 
          poster={'/videos/carla/'+id+'.jpg'} 
          autoPlay
          muted
          playsInline 
          loop 
          preload="metadata" 
          aria-label={title} 
          onError={()=>setFailed(true)}
          onClick={togglePlay}
        />
        <div className="film-controls-overlay">
          <button 
            type="button" 
            className="film-control-btn" 
            onClick={togglePlay} 
            aria-label={isPlaying?'Pause video':'Play video'}
          >
            {isPlaying ? <Pause size={16}/> : <Play size={16}/>}
          </button>
          <button 
            type="button" 
            className="film-control-btn" 
            onClick={toggleMute} 
            aria-label={isMuted?'Unmute sound':'Mute sound'}
          >
            {isMuted ? <VolumeX size={16}/> : <Volume2 size={16}/>}
          </button>
        </div>
        <span className="film-badge">Auto-playing</span>
      </div>
      <div className="film-info">
        <span>CARLA DIAMONDS · REEL IN MOTION</span>
        <h3>{title}</h3>
        {failed&&<p role="status">This film could not load. Please refresh to try again.</p>}
      </div>
    </article>
  );
}

export function ReelsGallery(){
  const[filter,setFilter]=useState('all');

  const filteredReels = filter==='all' 
    ? reels 
    : filter==='bangles' 
      ? reels.filter((_,i)=>[0,2,4,7,10,13].includes(i))
      : filter==='solitaires' 
        ? reels.filter((_,i)=>[1,3,6,9,12].includes(i))
        : reels.filter((_,i)=>[5,8,11,14].includes(i));

  return (
    <section className="section carla-films films-page" id="films" aria-label="Carla Diamonds films">
      <div className="section-heading">
        <div>
          <p className="eyebrow"><Sparkles size={14}/> THE COLLECTION IN MOTION · {reels.length} FILMS</p>
          <h2>A little movement.<br/><em>A lot of brilliance.</em></h2>
          <p>Handcrafted jewellery captured in motion. Videos play automatically as you scroll through our Vijayawada boutique reels.</p>
        </div>
      </div>

      <div className="film-tabs" role="tablist" aria-label="Filter films">
        <button className={filter==='all'?'active':''} onClick={()=>setFilter('all')}>All Films ({reels.length})</button>
        <button className={filter==='bangles'?'active':''} onClick={()=>setFilter('bangles')}>Bracelets & Bangles</button>
        <button className={filter==='solitaires'?'active':''} onClick={()=>setFilter('solitaires')}>Rings & Solitaires</button>
        <button className={filter==='necklaces'?'active':''} onClick={()=>setFilter('necklaces')}>Chains & Pendants</button>
      </div>

      <div className="carla-film-grid">
        {filteredReels.map(p=>(
          <StoreFilm key={p.id} id={p.id} title={p.title}/>
        ))}
      </div>
    </section>
  );
}

export function FilmsPreview(){
  return (
    <section className="films-preview" aria-label="Discover Carla films">
      <div className="films-preview-copy">
        <p className="eyebrow">THE CARLA FILM EDIT</p>
        <span className="film-count">01 — 15 / STORIES IN MOTION</span>
        <h2>Beauty, in<br/><em>every frame.</em></h2>
        <p>A glimpse of the sparkle. A closer look at the craft. Step into our world of jewellery, beautifully in motion.</p>
        <Link className="button light" href="/films">
          Explore all films <ArrowRight size={17}/>
        </Link>
      </div>
      <div className="film-preview-cards">
        {reels.slice(0,3).map((p,i)=>(
          <Link href={'/films#film-'+p.id} className="film-preview-card" key={p.id} aria-label={'Watch '+p.title}>
            <JewelleryImage src={'/videos/carla/'+p.id+'.jpg'} alt={p.title} loading="lazy"/>
            <span className="film-preview-play"><Play size={22}/></span>
            <div>
              <small>FILM {String(i+1).padStart(2,'0')}</small>
              <h3>{p.title}</h3>
              <span>Watch full film ↗</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function FilmsPage(){
  return (
    <>
      <div className="page-title carla-page-title">
        <p className="eyebrow">THE WORLD OF CARLA · BOUTIQUE FILMS</p>
        <h1>Made to move you.</h1>
        <p>Fifteen stories of brilliance. Videos auto-play seamlessly as you explore every sparkle and contour.</p>
        <Link className="text-link" href="/store-stories">
          Explore our store stories & boutique gallery <ArrowRight size={16}/>
        </Link>
      </div>
      <ReelsGallery/>
    </>
  );
}
