import {getGoldQuote} from '@/lib/live-gold';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(){return Response.json(await getGoldQuote(),{headers:{'Cache-Control':'no-store'}})}
