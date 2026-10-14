'use client';
import {useEffect,useRef,useState} from 'react';
import {storePosts} from '@/lib/instagram';
const reels=storePosts.filter(p=>p.kind==='reel');
function StoreFilm({id,title}:{id:string;title:string}){
 const video=useRef<HTMLVideoElement>(null);const[near,setNear]=useState(false),[failed,setFailed]=useState(false);
 useEffect(()=>{const el=video.current;if(!el)return;const observer=new IntersectionObserver(([entry])=>setNear(entry.isIntersecting),{threshold:.35});observer.observe(el);return()=>observer.disconnect()},[]);
 useEffect(()=>{const el=video.current;if(!el)return;const play=()=>{if(near&&!document.hidden&&!matchMedia('(prefers-reduced-motion: reduce)').matches){el.play().catch(()=>{})}else el.pause()};play();document.addEventListener('visibilitychange',play);return()=>{document.removeEventListener('visibilitychange',play);el.pause()}},[near]);
 return <article className="carla-film"><video ref={video} src={near?'/videos/carla/'+id+'.mp4':undefined} poster={'/videos/carla/'+id+'.jpg'} controls muted playsInline loop preload="none" aria-label={title} onError={()=>setFailed(true)}/><div><span>CARLA DIAMONDS · FILM</span><h3>{title}</h3>{failed&&<p role="status">This film could not load. Please refresh to try again.</p>}</div></article>
}
export function ReelsGallery(){
 return <section className="section carla-films" id="films" aria-label="Carla Diamonds films"><div className="section-heading"><div><p className="eyebrow">THE COLLECTION IN MOTION · ALL 15 FILMS</p><h2>A little movement.<br/><em>A lot of brilliance.</em></h2><p>Discover all our films right here. Use the player controls for sound, pause or fullscreen.</p></div></div><div className="carla-film-grid">{reels.map(p=><StoreFilm key={p.id} id={p.id} title={p.title}/>)}</div></section>
}
