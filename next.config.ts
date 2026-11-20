import type { NextConfig } from 'next';
const config: NextConfig = { poweredByHeader: false, async redirects(){return ['virtual-try-on','viewer','try','try-on','tryon'].map(route=>({source:'/'+route+'/:path*',destination:'/shop',permanent:false}));}, images:{qualities:[75,90]}, async headers(){return [{source:'/(.*)',headers:[{key:'X-Content-Type-Options',value:'nosniff'},{key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},{key:'X-Frame-Options',value:'DENY'},{key:'Permissions-Policy',value:'camera=(self), microphone=(), geolocation=()'}]}]} };
export default config;
