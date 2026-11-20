import {products} from '@/lib/store';
import {Home} from '@/components/home';
import {banners} from '@/lib/content';
import {siteSettings} from '@/lib/admin-store';
export const dynamic='force-dynamic';
export default async function Page(){const [catalogue,campaigns,site]=await Promise.all([products(),banners(),siteSettings()]);return <Home products={catalogue} banners={campaigns} site={site}/>}
