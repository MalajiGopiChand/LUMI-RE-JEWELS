import type {Product} from './catalogue';
import type {Point} from './try-on';

export type FaceProfile={proportion:'longer'|'balanced'|'broader';ratio:number};
export function faceProfile(points:Point[]|undefined,width:number,height:number):FaceProfile|null{
  if(!points||!width||!height||![10,152,234,454].every(i=>points[i]&&Number.isFinite(points[i].x)&&Number.isFinite(points[i].y)))return null;
  const distance=(a:number,b:number)=>Math.hypot((points[a].x-points[b].x)*width,(points[a].y-points[b].y)*height);
  const breadth=distance(234,454),length=distance(10,152);
  if(breadth<width*.12||length<height*.12)return null;
  const ratio=length/breadth;
  if(ratio<.7||ratio>2.3)return null;
  return {ratio,proportion:ratio>1.48?'longer':ratio<1.23?'broader':'balanced'};
}
export function faceEdit(profile:FaceProfile,products:Product[]){
  const reason=profile.proportion==='longer'?'Rounded hoops and compact shapes offer a soft horizontal contrast.':profile.proportion==='broader'?'Slender drops and pendant lines introduce a little vertical movement.':'A mix of sculptural and delicate shapes lets you explore different moods.';
  const score=(p:Product)=>{
    const text=(p.name+' '+p.description).toLowerCase();
    const rounded=/hoop|huggie|rounded|pearl|strand/.test(text),long=/drop|threader|lariat|pendant|slender/.test(text);
    return (profile.proportion==='longer'?Number(rounded):profile.proportion==='broader'?Number(long):Number(/sculptural|pearl|pendant/.test(text)))*10;
  };
  const available=products.filter(p=>p.status==='active'&&p.tryOnAsset&&p.variants.some(v=>v.stock>0));
  const ranked=(category:string)=>available.filter(p=>p.category===category).sort((a,b)=>score(b)-score(a));
  return {reason,products:[...ranked('Earrings').slice(0,3),...ranked('Necklaces').slice(0,2),...ranked('Rings').slice(0,1),...ranked('Bracelets').slice(0,1)]};
}
