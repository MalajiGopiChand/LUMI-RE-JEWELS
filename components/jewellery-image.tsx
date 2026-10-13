'use client';
import {useState,useEffect,type ImgHTMLAttributes} from 'react';
import Image from 'next/image';
type Props=Omit<ImgHTMLAttributes<HTMLImageElement>,'src'|'width'|'height'|'srcSet'>&{src?:string;width?:number;height?:number};
export function JewelleryImage({src,alt,width=1200,height=1200,...props}:Props){
  const [failed,setFailed]=useState(false);
  useEffect(()=>setFailed(false),[src]);
  const url=failed||!src?'/images/image-unavailable.svg':src;
  return <Image {...props} src={url} alt={alt||''} width={width} height={height}
    unoptimized={url.startsWith('https:')||url.endsWith('.svg')}
    loading={props.fetchPriority==='high'?'eager':props.loading||'lazy'}
    sizes={props.className?.includes('hero-image')?'100vw':'(max-width: 760px) 50vw, (max-width: 1100px) 33vw, 25vw'}
    onError={()=>setFailed(true)}/>;
}
