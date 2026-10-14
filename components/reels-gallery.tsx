'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {ArrowLeft,ArrowRight} from 'lucide-react';
import {storePosts} from '@/lib/instagram';
const reels=storePosts.filter(p=>p.kind==='reel');
function StoreFilm({id,title}:{id:string;title:string}){
 const video=useRef<HTMLVideoElement>(null);const[near,setNear]=useState(false),[failed,setFailed]=useState(false);
 useEffect(()=>{const el=video.current;if(!el)return;const observer=new IntersectionObserver(([entry])=>setNear(entry.isIntersecting),{threshold:.35});observer.observe(el);return()=>observer.disconnect()},[]);
 useEffect(()=>{const el=video.current;if(!el)return;const play=()=>{if(near&&!document.hidden&&!matchMedia('(prefers-reduced-motion: reduce)').matches){el.play().catch(()=>{})}else el.pause()};play();document.addEventListener('visibilitychange',play);return()=>{document.removeEventListener('visibilitychange',play);el.pause()}},[near]);
 return <article className="carla-film"><video ref={video} src={near?'/videos/carla/'+id+'.mp4':undefined} poster={'/videos/carla/'+id+'.jpg'} controls muted playsInline loop preload="none" aria-label={title} onError={()=>setFailed(true)}/><div><span>CARLA DIAMONDS · FILM</span><h3>{title}</h3>{failed&&<p role="status">This film could not load. Please refresh to try again.</p>}</div></article>
}
export function ReelsGallery({featured=false}:{featured?:boolean}){
 const[start,setStart]=useState(0),[count,setCount]=useState(6);
 const displayed=featured?Array.from({length:3},(_,i)=>reels[(start+i)%reels.length]):reels.slice(0,count);
 return <section className="section carla-films" aria-label="Carla Diamonds films"><div className="section-heading"><div><p className="eyebrow">THE COLLECTION IN MOTION</p><h2>A little movement.<br/><em>A lot of brilliance.</em></h2><p>Discover our pieces in motion. Films play here, with sound off.</p></div>{featured&&<div className="film-arrows"><button aria-label="Previous films" onClick={()=>setStart(i=>(i+reels.length-3)%reels.length)}><ArrowLeft size={18}/></button><button aria-label="Next films" onClick={()=>setStart(i=>(i+3)%reels.length)}><ArrowRight size={18}/></button></div>}</div><div className="carla-film-grid">{displayed.map(p=><StoreFilm key={p.id} id={p.id} title={p.title}/>)}</div><div className="center">{featured?<Link className="text-link" href="/store-stories">Explore all {reels.length} films <ArrowRight size={16}/></Link>:count<reels.length&&<button className="button outline" onClick={()=>setCount(c=>c+6)}>More films <ArrowRight size={16}/></button>}</div></section>
}
