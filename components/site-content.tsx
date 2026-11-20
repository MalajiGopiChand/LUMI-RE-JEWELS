'use client';
import {createContext,useContext,type ReactNode} from 'react';
import Link from 'next/link';
import {defaultSiteSettings,type SiteSettings,type PageContent} from '@/lib/site-settings';
import {JewelleryImage} from './jewellery-image';
const SiteContext=createContext<SiteSettings>(defaultSiteSettings);
export function SiteProvider({site,children}:{site:SiteSettings;children:ReactNode}){return <SiteContext.Provider value={site}>{children}</SiteContext.Provider>;}
export const useSite=()=>useContext(SiteContext);
export function ManagedHero({content}:{content:PageContent}){return <section className="managed-hero"><div><p className="eyebrow">{content.eyebrow}</p><h1>{content.title}</h1><p>{content.description}</p>{content.body&&<p className="managed-body">{content.body}</p>}<Link className="button" href="/shop">Explore the collection</Link></div>{content.image&&<JewelleryImage src={content.image} alt={content.title} loading="eager"/>}</section>;}
