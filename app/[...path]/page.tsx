import {products} from '@/lib/store';
import {Pages} from '@/components/pages';
import {notFound,redirect} from 'next/navigation';
export const dynamic='force-dynamic';
export default async function Page({params}:{params:Promise<{path:string[]}>}){const {path}=await params;if(['try','try-on','tryon'].includes(path[0]))redirect('/virtual-try-on');if(['necklaces','earrings','rings','bracelets'].includes(path[0]))redirect('/category/'+path[0]);if(path[0]==='category'&&!['necklaces','earrings','rings','bracelets'].includes(path[1]))notFound();const valid=['new-arrivals','shop','collections','category','product','ai-stylist','virtual-try-on','viewer','wishlist','cart','checkout','payment-status','track-order','account','orders','size-guide','about','contact','faq','policies','search','admin'];if(!valid.includes(path[0]))notFound();return <Pages path={path} products={await products()}/>}
