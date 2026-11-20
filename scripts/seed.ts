import {loadEnvConfig} from '@next/env';
import {hasSupabase} from '../lib/supabase';
import {catalogue} from '../lib/admin-store';
loadEnvConfig(process.cwd());
async function seed(){if(!hasSupabase())throw new Error('Configure Supabase and run supabase/setup.sql first.');const rows=await catalogue(true);console.log('Supabase catalogue ready: '+rows.length+' products. Existing records were preserved.');}
seed().catch(error=>{console.error(error.message);process.exitCode=1;});
