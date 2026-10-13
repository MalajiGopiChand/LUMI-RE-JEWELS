import {db} from './db';
import {ProductModel} from '@/models';
import {sampleProducts,type Product} from './catalogue';
export async function products():Promise<Product[]>{if(!process.env.MONGODB_URI)return sampleProducts;await db();return JSON.parse(JSON.stringify(await ProductModel.find({status:'active'}).lean()));}
