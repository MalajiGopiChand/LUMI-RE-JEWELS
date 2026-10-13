import {db} from '../lib/db';
import {ProductModel} from '../models';
import {sampleProducts} from '../lib/catalogue';
import {loadEnvConfig} from '@next/env';
loadEnvConfig(process.cwd());
async function seed(){await db();for(const p of sampleProducts)await ProductModel.updateOne({id:p.id},{$setOnInsert:p},{upsert:true});console.log('Sample catalogue seeded without overwriting existing products.');process.exit(0)}
seed().catch(e=>{console.error(e.message);process.exit(1)});
