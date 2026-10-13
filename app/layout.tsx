import type {Metadata,Viewport} from 'next';
import './globals.css';
import {StoreProvider} from '@/components/store';
export const metadata:Metadata={metadataBase:new URL(process.env.APP_URL||(process.env.VERCEL_PROJECT_PRODUCTION_URL?'https://'+process.env.VERCEL_PROJECT_PRODUCTION_URL:'http://localhost:3000')),title:{default:'CARLA DIAMONDS — Elegance beyond time',template:'%s | CARLA DIAMONDS'},description:'Discover Carla Diamonds. Explore our jewellery, original store videos and photographs, and virtual try-on studio.',applicationName:'Carla Diamonds',openGraph:{title:'Carla Diamonds',description:'Elegance beyond time. Discover our jewellery and store stories.',images:[{url:'/images/brand/carla-logo.jpg',width:640,height:640,alt:'Carla Diamonds'}]},twitter:{card:'summary',title:'Carla Diamonds',images:['/images/brand/carla-logo.jpg']}};
export const viewport:Viewport={themeColor:'#640642'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" data-scroll-behavior="smooth"><body><StoreProvider>{children}</StoreProvider></body></html>}
