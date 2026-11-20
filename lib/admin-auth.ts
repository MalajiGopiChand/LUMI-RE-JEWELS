import bcrypt from 'bcryptjs';
import {hasSupabase,supabaseServer,databaseError} from './supabase';
/** Once a database administrator is configured, it supersedes bootstrap env credentials. */
export async function verifyAdministrator(email:string,password:string){
  const normalized=email.trim().toLowerCase();
  if(hasSupabase()){
    const client=supabaseServer();
    const {data,error}=await client.from('carla_content').select('data').eq('kind','admin-auth').eq('key',normalized).maybeSingle();databaseError(error);
    if(data)return data.data?.role==='admin'&&typeof data.data.passwordHash==='string'&&await bcrypt.compare(password,data.data.passwordHash);
    const existing=await client.from('carla_content').select('key',{count:'exact',head:true}).eq('kind','admin-auth');databaseError(existing.error);
    if(existing.count)return false;
  }
  return !!(process.env.ADMIN_EMAIL?.toLowerCase()===normalized&&process.env.ADMIN_PASSWORD_HASH&&await bcrypt.compare(password,process.env.ADMIN_PASSWORD_HASH));
}
