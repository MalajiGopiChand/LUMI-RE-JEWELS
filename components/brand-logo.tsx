import Image from 'next/image';
export function BrandLogo({className=''}:{className?:string}){
  return <Image className={'brand-logo '+className} src="/images/brand/carla-logo.jpg" alt="Carla Diamonds" width={640} height={640} priority/>;
}
