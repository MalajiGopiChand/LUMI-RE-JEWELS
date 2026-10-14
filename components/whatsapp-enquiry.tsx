'use client';
import {useEffect,useState} from 'react';
import {MessageCircle} from 'lucide-react';
import {enquiryText,whatsappUrl,type EnquiryItem} from '@/lib/enquiry';
export function WhatsAppEnquiry({items,label='Ask about this piece',name='',question}:{items:EnquiryItem[];label?:string;name?:string;question?:string}){const[base,setBase]=useState('');useEffect(()=>setBase(window.location.origin),[]);return <a className="whatsapp-enquiry" href={whatsappUrl(enquiryText(items,name,question,base))} target="_blank" rel="noopener noreferrer"><MessageCircle size={17}/>{label}</a>}
