export const instagramProfile='https://www.instagram.com/carladiamonds/';
export type StorePost={id:string;kind:'reel'|'photo';url:string;title:string};
const reels=['DdtVu27Tblb','DdobLfgT6ml','DdjKDW3Tp68','DddLmpixE3t','DdWJWFZT-RK','DdTk2LFTE6-','DdgmshDTafU','DdImHzbR_LV','Dc3XVFsz-U6','DcqjBgQzW1j','DcODmfjzb3Q','DbdI5e7zhHR','DaQMFeGzBQr','DaDP-Ryzw3J','DZxbtrcz4Da'];
export const storePosts:StorePost[]=[...reels.map((id,i)=>({id,kind:'reel' as const,url:`${instagramProfile}reel/${id}/`,title:i===0?'Elegance beyond time':`From the Carla collection · ${String(i+1).padStart(2,'0')}`})),{id:'DZxbHeck6sI',kind:'photo',url:`${instagramProfile}p/DZxbHeck6sI/`,title:'Brilliance in every detail'}];
