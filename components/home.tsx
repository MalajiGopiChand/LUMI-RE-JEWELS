'use client';
import Link from 'next/link';
import {ArrowRight,Instagram,ScanFace,Diamond,Heart,Sparkles,MoveUpRight} from 'lucide-react';
import {Shell,ProductCard} from './store';
import {JewelleryImage} from './jewellery-image';
import {InstagramGallery,CarlaSlideshow} from './instagram-gallery';
import {categories,categoryHref,type Product} from '@/lib/catalogue';
import {instagramProfile,storePosts} from '@/lib/instagram';
import type {Banner} from '@/lib/content';

export function Home({products,banners=[]}:{products:Product[];banners?:Banner[]}){
 const campaign=banners[0];
 return <Shell>
  <CarlaSlideshow/>
  <div className="carla-brand-strip"><span><Diamond size={18}/> Jewellery with character</span><span><Heart size={18}/> Moments to treasure</span><span><Instagram size={18}/> Stories from our store</span></div>
  
  <InstagramGallery featured/>
  <section className="section carla-category-section"><div className="section-heading"><div><p className="eyebrow">EXPLORE THE BOUTIQUE</p><h2>A little brilliance. <em>Every day.</em></h2></div><Link className="text-link" href="/shop">Browse all jewellery <ArrowRight size={15}/></Link></div><div className="category-grid">{categories.map((c,i)=><Link key={c.name} href={categoryHref(c.name)} className="category-card"><div className="category-image"><JewelleryImage src={c.image} alt={c.name}/><span>0{i+1}</span></div><div><h3>{c.name}</h3><ArrowRight size={18}/></div><p>{c.note}</p></Link>)}</div><p className="sample-note">Explore illustrative designs in the demo boutique. Our original store collection appears in Store Stories.</p></section>
  <section className="carla-studio-feature"><div><p className="eyebrow"><ScanFace size={16}/> YOUR PERSONAL DISCOVERY STUDIO</p><h2>See it on you.<br/><em>Feel the possibility.</em></h2><p>Explore the virtual try-on studio and discover a style that feels like your own.</p><Link className="button light" href="/virtual-try-on">Try a little brilliance <ArrowRight size={16}/></Link></div><div className="carla-studio-detail"><JewelleryImage src="/images/carla/diamond-bracelet-detail.webp" alt="Carla Diamonds bracelet, a closer look at the original store design"/><span>CARLA DIAMONDS · THE FINER DETAILS</span></div></section>
  <section className="section"><div className="section-heading"><div><p className="eyebrow">THE DISCOVERY EDIT · SAMPLE DESIGNS</p><h2>Find your kind of <em>extraordinary.</em></h2></div><Link className="text-link" href="/shop">Discover the edit <ArrowRight size={15}/></Link></div><div className="product-grid">{products.slice(0,4).map(p=><ProductCard key={p.id} product={p}/>)}</div></section>
  <section className="carla-closing"><Sparkles size={26}/><p className="eyebrow">SOME STORIES DESERVE TO SHINE</p><h2>Your moment.<br/><em>Your Carla Diamonds.</em></h2><div><Link className="button" href="/ai-stylist">Find your personal edit <ArrowRight size={16}/></Link><a className="text-link" href={instagramProfile} target="_blank" rel="noopener noreferrer">Visit our Instagram <Instagram size={16}/></a></div></section>
 </Shell>;
}
