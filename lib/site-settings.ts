import {z} from 'zod';
import {carlaPhotos} from './carla-media';
export const pageKeys=['home','new-arrivals','shop','necklaces','earrings','rings','bracelets','collections','store-stories','about','ai-stylist','try-on-studio'] as const;
export const mediaUrl=z.string().max(2000).refine(v=>v===''||(v.startsWith('/')&&!v.startsWith('//'))||v.startsWith('https://'),'Use a site image or an HTTPS URL');
export const pageContentSchema=z.object({title:z.string().max(160),eyebrow:z.string().max(100).default('CARLA DIAMONDS'),description:z.string().max(1500).default(''),body:z.string().max(8000).default(''),image:mediaUrl.default('')});
export const storySchema=z.object({id:z.string().min(1).max(100),title:z.string().min(1).max(160),image:mediaUrl.refine(v=>v.length>0),description:z.string().max(2000).default(''),group:z.enum(['collection','campaign','about']).default('collection'),enabled:z.boolean().default(true)});
export const collectionSchema=z.object({id:z.string().regex(/^[a-z0-9-]+$/),title:z.string().min(1).max(160),image:mediaUrl,description:z.string().max(1500).default(''),productIds:z.array(z.string().max(100)).max(500).default([]),enabled:z.boolean().default(true)});
export const siteSettingsSchema=z.object({pages:z.record(z.enum(pageKeys),pageContentSchema).default({}),stories:z.array(storySchema).max(200).default([]),collections:z.array(collectionSchema).max(50).default([])});
export type PageContent=z.infer<typeof pageContentSchema>;
export type SiteSettings=z.infer<typeof siteSettingsSchema>;
export const defaultSiteSettings:SiteSettings={pages:{},stories:carlaPhotos.map(p=>({id:p.id,title:p.title,image:p.src,description:'',group:p.group as 'collection'|'campaign'|'about',enabled:true})),collections:[
  {id:'golden-edit',title:'The Golden Edit',description:'Sculptural forms. Golden warmth. Your everyday, elevated.',image:'/images/editorial/gold.jpg',productIds:[],enabled:true},
  {id:'forever',title:'A Forever Feeling',description:'For the promises, the possibilities, and everything ahead.',image:'/images/products/lj-2.png',productIds:[],enabled:true},
  {id:'little-acts-of-love',title:'Little Acts of Love',description:'Because the smallest gestures mean the most.',image:'/images/products/lj-3.png',productIds:[],enabled:true}
]};
