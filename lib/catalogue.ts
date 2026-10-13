export type Variant = { sku: string; size: string; metal: string; price: number; stock: number };
export type Product = {
  id: string; slug: string; name: string; category: string; description: string;
  metal: string; purity: string; weight: number; gemstones: string; images: string[];
  price: number; badge?: string; occasion: string[]; variants: Variant[];
  model3D?: string; tryOnAsset?: string; status: 'active' | 'draft'; sample?: boolean;
};
export const images = {
  hero: '/images/editorial/campaign.jpg', earrings: '/images/products/lj-1.png',
  necklace: '/images/products/lj-3.png', ring: '/images/products/lj-2.png',
  bracelet: '/images/products/lj-4.png', story: '/images/editorial/story.jpg',
  gold: '/images/editorial/gold.jpg', model: '/images/editorial/portrait.jpg',
  campaignTwo: '/images/editorial/details.jpg', campaignThree: '/images/editorial/celebration.jpg',
};
type Entry = [name: string, category: string, price: number, metal: string, gemstones: string, description: string];
const entries: Entry[] = [
  ['The Solstice Hoops','Earrings',18500,'Yellow gold','None','Rounded, sculptural gold hoops with a beautifully polished finish. A quiet signature for every day.'],
  ['Éclat Diamond Ring','Rings',42500,'White gold','Lab-grown diamond','A brilliant solitaire on a fine white gold band. A luminous expression of something lasting.'],
  ['Golden Hour Pendant','Necklaces',24900,'Yellow gold','None','An oval sun medallion suspended on a delicate chain. A little warmth, wherever you go.'],
  ['The Serein Bracelet','Bracelets',32000,'Yellow gold','Lab-grown diamonds','Delicate bezel-set diamonds trace a fluid gold circle. Effortless radiance for your everyday rituals.'],
  ['Aurora Statement Earrings','Earrings',28900,'Yellow gold','None','Three sculptural teardrops catch the light as you move. Designed for your brightest evenings.'],
  ['The Promise Band','Rings',21500,'Yellow gold','None','A softly rounded, polished gold band. A simple circle with room for your own story.'],
  ['Carla Layered Chain','Necklaces',36900,'Yellow gold','None','Two fine chains and a little golden disc. A considered composition, ready to wear together.'],
  ['The Muse Cuff','Bracelets',27500,'Yellow gold','None','An open cuff with flowing, asymmetric edges. Sculptural, expressive and entirely your own.'],
  ['Pearl Reverie Drops','Earrings',16900,'Yellow gold','Freshwater pearls','Luminous freshwater pearls suspended beneath little gold spheres. Soft elegance, beautifully understated.'],
  ['Rouge Halo Ring','Rings',58900,'Yellow gold','Ruby and lab-grown diamonds','An oval ruby framed by a delicate diamond halo. A small celebration of colour and light.'],
  ['The Pearl Chapter','Necklaces',22900,'Yellow gold','Freshwater pearls','A fine strand of ivory pearls with a discreet gold clasp. A classic, with a modern point of view.'],
  ['Petite Pearl Bracelet','Bracelets',14900,'Yellow gold','Freshwater pearls','Tiny golden beads and luminous pearls form an elegant circle. Beautiful alone or softly layered.'],
  ['Whisper Threaders','Earrings',12900,'Yellow gold','None','A fine chain and a slender golden bar. A delicate line that moves gently with you.'],
  ['Rose Entwined Ring','Rings',26900,'Rose gold','None','Two rose gold strands intertwine in a sculptural band. A warm, modern expression of connection.'],
  ['Verdant Drop Pendant','Necklaces',38900,'Yellow gold','Emerald','A pear-shaped emerald rests within a fine gold bezel. An intimate flash of green, close to your heart.'],
  ['Rose Paperclip Bracelet','Bracelets',19900,'Rose gold','None','Delicate, elongated rose gold links bring a little structure to your daily stack.'],
  ['Emerald Light Studs','Earrings',34900,'Yellow gold','Emeralds','Rich rectangular emeralds in polished gold bezels. Small treasures with a beautifully clear presence.'],
  ['Moonlit Pearl Ring','Rings',31900,'White gold','Freshwater pearl and lab-grown diamonds','An ivory pearl sits on a curved white gold band with tiny diamond accents. A gentle glow after dusk.'],
  ['Heartfelt Rose Pendant','Necklaces',17900,'Rose gold','None','A tiny, polished rose gold heart on a fine chain. A little act of love you can wear.'],
  ['Celestial Gold Bangle','Bracelets',42900,'Yellow gold','None','A slender gold bangle with three engraved stars. Made to mark your own constellation of moments.'],
  ['Diamond Huggie Hoops','Earrings',23900,'Yellow gold','Lab-grown diamonds','Tiny hoops with a delicate row of diamonds. An everyday sparkle, perfectly close.'],
  ['Sapphire Horizon Ring','Rings',64900,'White gold','Sapphire and lab-grown diamonds','A deep blue sapphire balanced by two bright side stones. A clear, confident expression of colour.'],
  ['Starlight Lariat','Necklaces',29900,'Yellow gold','Lab-grown diamond','A fine golden Y silhouette meets a tiny diamond bezel. A beautiful line for open necklines.'],
  ['Verdant Link Bracelet','Bracelets',35900,'Yellow gold','Emeralds','Three emerald bezels sit along a fine gold chain. A considered touch of colour for your wrist.'],
];
export const sampleProducts: Product[] = entries.map(([name,category,price,metal,gemstones,description],i) => {
  const id=`lj-${i+1}`;
  return {
    id,slug:name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-'),
    name,category,price,description,images:[`/images/products/${id}.png`],
    badge:i<2?'Bestseller':i>=16?'New':i===6?'Limited edition':undefined,
    metal,purity:'18K',weight:Number((2.2+(i%7)*.65).toFixed(2)),gemstones,
    occasion:i%3===0?['Everyday','Gifting']:i%3===1?['Wedding','Celebrations']:['Everyday','Celebrations','Gifting'],
    variants:(category==='Rings'?['10','12','14','16']:category==='Bracelets'?['16 cm','18 cm']:['One size'])
      .map((size,j)=>({sku:`LJ-${i+1}-${j+1}`,size,metal,price,stock:8+j})),
    model3D:`/models/${id}.glb`,tryOnAsset:i===0?'/images/products/lj-1-overlay.png':`/images/products/${id}.png`,status:'active',sample:true,
  };
});
export const categories = [
  {name:'Necklaces',slug:'necklaces',image:images.necklace,note:'Close to your heart',description:'Fine chains, luminous pearls and thoughtful pendants. Find the piece that feels personal.'},
  {name:'Earrings',slug:'earrings',image:images.earrings,note:'A little everyday radiance',description:'From delicate studs to sculptural drops. A considered finishing touch for every kind of day.'},
  {name:'Rings',slug:'rings',image:images.ring,note:'For all your promises',description:'Quiet bands, bright solitaires and expressive gemstones. Precious circles for your own story.'},
  {name:'Bracelets',slug:'bracelets',image:images.bracelet,note:'An effortless finishing touch',description:'Fluid links, pearl strands and sculptural cuffs. Beautiful companions to your everyday rituals.'},
];
export const categoryHref = (name: string) => '/category/'+(categories.find(c=>c.name===name)?.slug||name.toLowerCase());
export const money = (n:number) => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n);
