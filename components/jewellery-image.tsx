'use client';
import {useState,useEffect,type ImgHTMLAttributes} from 'react';
import Image from 'next/image';
type Props=Omit<ImgHTMLAttributes<HTMLImageElement>,'src'|'width'|'height'|'srcSet'>&{src?:string;width?:number;height?:number};
export function JewelleryImage({src,alt,width=1200,height=1200,sizes,...props}:Props){
  const [failed,setFailed]=useState(false);
  useEffect(()=>setFailed(false),[src]);
  const url=failed||!src?'/images/image-unavailable.svg':src;
  return <Image {...props} src={url} alt={alt||''} width={width} height={height}
    unoptimized={url.startsWith('https:')||url.endsWith('.svg')}
    loading={props.fetchPriority==='high'?'eager':props.loading||'lazy'}
    quality={90}
    sizes={sizes||(props.className?.includes('hero-image')?'100vw':'(max-width: 760px) 100vw, 50vw')}
    onError={()=>setFailed(true)}/>;
}
