import {z} from 'zod';
import {db} from './db';
import {Content} from '@/models';
export const bannerSchema=z.object({label:z.string().max(100),heading:z.string().min(1).max(120),copy:z.string().max(250),image:z.string().url().refine(s=>s.startsWith('https://')),href:z.string().refine(s=>s.startsWith('/')&&!s.startsWith('//')),cta:z.string().max(60),enabled:z.boolean().default(true),startsAt:z.string().datetime().optional(),endsAt:z.string().datetime().optional()});
export type Banner=z.infer<typeof bannerSchema>;
export async function banners():Promise<Banner[]>{if(!process.env.MONGODB_URI)return [];await db();const rows=await Content.find({kind:'banners'}).sort({key:1}).lean();const now=Date.now();return rows.flatMap(row=>{const p=bannerSchema.safeParse(row.data);if(!p.success)return [];const b=p.data;return b.enabled&&(!b.startsAt||Date.parse(b.startsAt)<=now)&&(!b.endsAt||Date.parse(b.endsAt)>now)?[b]:[]}).slice(0,3)}
