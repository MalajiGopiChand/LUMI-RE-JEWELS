import type {Product} from './catalogue';
export type GoldPricing={enabled:boolean;netGoldWeight:number;stoneWeight:number;stoneValue:number;makingCharge:number;makingChargeType:'fixed'|'perGram'|'percent';taxPercent:number};
export function jewelleryEstimate(product:Pick<Product,'purity'|'metal'|'goldPricing'>,rates:Record<string,number>){
  const p=product.goldPricing;if(!p?.enabled)return null;
  if(![p.netGoldWeight,p.stoneWeight,p.stoneValue,p.makingCharge,p.taxPercent].every(n=>Number.isFinite(n)&&n>=0)||p.netGoldWeight<=0||p.taxPercent>100)return null;
  const metal=metalEstimate({...product,weight:p.netGoldWeight},rates);if(metal===null)return null;
  const round=(n:number)=>Math.round(n*100)/100;
  const making=round(p.makingChargeType==='percent'?metal*p.makingCharge/100:p.makingChargeType==='perGram'?p.netGoldWeight*p.makingCharge:p.makingCharge);
  const subtotal=round(metal+making+p.stoneValue),tax=round(subtotal*p.taxPercent/100);
  return {metal,making,stones:p.stoneValue,tax,total:round(subtotal+tax)};
}

export function metalEstimate(product: Pick<Product,'purity'|'weight'|'metal'>, rates:Record<string,number>){
  const karat=Number(product.purity.toUpperCase().replace('K',''));
  if(!product.metal.toLowerCase().includes('gold')||!Number.isFinite(product.weight)||product.weight<=0||![14,18,22,24].includes(karat))return null;
  const rate=rates[`${karat}K`]??rates['24K']*karat/24;
  return Number.isFinite(rate)&&rate>0?Math.round(rate*product.weight*100)/100:null;
}
