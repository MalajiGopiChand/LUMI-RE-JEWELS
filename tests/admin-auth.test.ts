import {test} from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import {verifyAdministrator} from '../lib/admin-auth';
test('bootstrap administrator login normalizes email and rejects incorrect credentials',async()=>{
 const keys=['SUPABASE_URL','NEXT_PUBLIC_SUPABASE_URL','SUPABASE_SECRET_KEY','ADMIN_EMAIL','ADMIN_PASSWORD_HASH'];
 const original=Object.fromEntries(keys.map(key=>[key,process.env[key]]));
 try{
  for(const key of keys)delete process.env[key];
  process.env.ADMIN_EMAIL='owner@example.invalid';process.env.ADMIN_PASSWORD_HASH=await bcrypt.hash('test-only-password',4);
  assert.equal(await verifyAdministrator('OWNER@example.invalid','test-only-password'),true);
  assert.equal(await verifyAdministrator('owner@example.invalid','incorrect'),false);
  assert.equal(await verifyAdministrator('someone@example.invalid','test-only-password'),false);
 }finally{for(const key of keys){if(original[key]===undefined)delete process.env[key];else process.env[key]=original[key];}}
});
