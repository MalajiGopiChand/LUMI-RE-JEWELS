import {boutique} from './carla-media';
export type EnquiryItem={name:string;sku?:string;size?:string;metal?:string;quantity?:number;slug?:string};
export function enquiryText(items:EnquiryItem[],name='',question='Please confirm availability, price and details before I order.',base=''){
 const intro=`Hello Carla Diamonds${name.trim()?`, I am ${name.trim()}`:''}.`;
 return [intro,...items.map(i=>[i.name,i.sku&&`Reference: ${i.sku}`,i.size&&`Size: ${i.size}`,i.metal&&`Metal: ${i.metal}`,i.quantity&&`Quantity: ${i.quantity}`,i.slug&&base&&`${base}/product/${encodeURIComponent(i.slug)}`].filter(Boolean).join('\n')),question.trim()].filter(Boolean).join('\n\n');
}
export function whatsappUrl(text:string){return `https://wa.me/${boutique.tel.replace(/\D/g,'')}?text=${encodeURIComponent(text)}`;}
