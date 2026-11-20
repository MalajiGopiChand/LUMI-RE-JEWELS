import {loadEnvConfig} from '@next/env';
import {supabaseServer,databaseError} from '../lib/supabase';
loadEnvConfig(process.cwd());
async function configure(){
 const email=process.env.ADMIN_EMAIL?.trim().toLowerCase(),passwordHash=process.env.ADMIN_PASSWORD_HASH;
 if(!email||!passwordHash||!/^\$2[aby]\$\d{2}\$/.test(passwordHash))throw new Error('Configure ADMIN_EMAIL and a valid bcrypt ADMIN_PASSWORD_HASH in the private environment first.');
 const {error}=await supabaseServer().from('carla_content').upsert({kind:'admin-auth',key:email,data:{role:'admin',passwordHash},updated_at:new Date().toISOString()});databaseError(error);
 console.log('Administrator account configured in protected Supabase storage. No plaintext password was stored.');
}
configure().catch(error=>{console.error(error.message);process.exitCode=1;});
