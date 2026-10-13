import {cookies} from 'next/headers';
import {SignJWT,jwtVerify} from 'jose';
import {createHash,timingSafeEqual,createHmac} from 'node:crypto';
import {db} from './db';
import {RateLimit} from '@/models';
export function secret(){const s=process.env.SESSION_SECRET;if(!s||s.length<32)throw new Error('Set SESSION_SECRET to at least 32 random characters.');return new TextEncoder().encode(s);}
export async function session(){try{const c=(await cookies()).get('lumiere-session');if(!c)return null;return(await jwtVerify(c.value,secret(),{issuer:'lumiere'})).payload as {sub:string;role:string;email:string};}catch{return null;}}
export async function signIn(sub:string,role:string,email:string){const token=await new SignJWT({role,email}).setProtectedHeader({alg:'HS256'}).setSubject(sub).setIssuer('lumiere').setIssuedAt().setExpirationTime('8h').sign(secret());(await cookies()).set('lumiere-session',token,{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',maxAge:28800});}
export async function admin(){const user=await session();if(user?.role!=='admin')throw new HttpError(401,'Administrator sign-in required.');return user;}
export class HttpError extends Error{constructor(public status:number,message:string){super(message)}}
export function origin(req:Request){const requestURL=new URL(req.url);const expected=process.env.APP_URL?new URL(process.env.APP_URL).origin:requestURL.protocol+'//'+(req.headers.get('host')||requestURL.host);if(req.headers.get('origin')!==expected)throw new HttpError(403,'Invalid request origin.');}
export const hash=(s:string)=>createHash('sha256').update(s).digest('hex');
export function verifyHmac(body:string,signature:string,key:string){const expected=createHmac('sha256',key).update(body).digest('hex');return /^[0-9a-f]{64}$/i.test(signature)&&timingSafeEqual(Buffer.from(expected,'hex'),Buffer.from(signature,'hex'));}
const memory=new Map<string,{count:number;expires:number}>();
export async function limit(req:Request,bucket:string,max=15){const key=hash(bucket+':'+(req.headers.get('x-forwarded-for')?.split(',')[0]||'local'));const period=Math.floor(Date.now()/60000);if(process.env.MONGODB_URI){await db();const r=await RateLimit.findOneAndUpdate({_id:key+period},{$inc:{count:1},$setOnInsert:{expiresAt:new Date(Date.now()+120000)}},{upsert:true,new:true});if(r.count>max)throw new HttpError(429,'Please wait a minute before trying again.');}else{const now=Date.now();for(const[k,v]of memory)if(v.expires<now)memory.delete(k);const r=memory.get(key)||{count:0,expires:now+60000};r.count++;memory.set(key,r);if(r.count>max)throw new HttpError(429,'Please wait a minute before trying again.');}}
