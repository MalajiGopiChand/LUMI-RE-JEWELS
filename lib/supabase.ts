import {createClient,type SupabaseClient} from '@supabase/supabase-js';
let client:SupabaseClient|undefined;
export function hasSupabase(){return !!((process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL)&&process.env.SUPABASE_SECRET_KEY);}
export function supabaseServer(){
  if(typeof window!=='undefined')throw new Error('Supabase administration is server-only.');
  const url=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY;
  if(!url||!key)throw new Error('Supabase is not configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY.');
  if(!client)client=createClient(url.replace(/\/rest\/v1\/?$/,''),key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:(input,init)=>fetch(input,{...init,cache:'no-store',signal:init?.signal??AbortSignal.timeout(15000)})}});
  return client;
}
export function databaseError(error:{code?:string;message:string}|null){
  if(!error)return;
  if(error.code==='42P01'||error.code==='PGRST205'||error.code==='PGRST202')throw new Error('Supabase setup is incomplete. Run supabase/setup.sql in your project SQL Editor.');
  if(error.code==='23505')throw new Error('A record with those product or account details already exists.');
  throw new Error('Supabase request failed: '+error.message);
}
export const mediaBucket='carla-jewellery';
