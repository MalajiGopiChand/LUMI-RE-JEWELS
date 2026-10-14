import {z} from 'zod';
export const goldQuoteSchema=z.object({metal:z.literal('XAU'),currency:z.literal('INR'),timestamp:z.number().int().positive(),price_gram_24k:z.number().positive(),price_gram_22k:z.number().positive(),price_gram_18k:z.number().positive()});
export function normalizeGoldQuote(input:unknown,now=Date.now()){const q=goldQuoteSchema.parse(input);if(q.timestamp*1000>now+60000)throw new Error('Invalid future quote');return {source:'GoldAPI.io',currency:'INR',unit:'gram',timestamp:q.timestamp*1000,rates:{'24K':q.price_gram_24k,'22K':q.price_gram_22k,'18K':q.price_gram_18k}};}
