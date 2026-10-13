import type {Metadata} from 'next';
import './globals.css';
import {StoreProvider} from '@/components/store';
export const metadata:Metadata={title:{default:'LUMIÈRE JEWELS — A little light. Always yours.',template:'%s | LUMIÈRE JEWELS'},description:'Discover a considered collection of fine jewellery. Sculptural gold, luminous diamonds, and pieces to make your own.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" data-scroll-behavior="smooth"><body><StoreProvider>{children}</StoreProvider></body></html>}
