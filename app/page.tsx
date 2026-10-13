import {products} from '@/lib/store';
import {Home} from '@/components/home';
import {banners} from '@/lib/content';
export const dynamic='force-dynamic';
export default async function Page(){const [catalogue,campaigns]=await Promise.all([products(),banners()]);return <Home products={catalogue} banners={campaigns}/>}
