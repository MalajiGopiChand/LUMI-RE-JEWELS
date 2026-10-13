import {mkdir,writeFile} from 'node:fs/promises';
const sources={campaign:'photo-1617038220319-276d3cfab638',story:'photo-1535632066927-ab7c9ab60908',gold:'photo-1611652022419-a9419f74343d',portrait:'photo-1534528741775-53994a69daeb',details:'photo-1599643477877-530eb83abc8e',celebration:'photo-1611591437281-460bfbe1220a'};
await mkdir('public/images/editorial',{recursive:true});
for(const[name,id]of Object.entries(sources)){
  const url=`https://images.unsplash.com/${id}?auto=format&fit=crop&w=${name==='campaign'?2000:1200}&q=85`;
  const r=await fetch(url,{signal:AbortSignal.timeout(30000)});
  if(!r.ok||!r.headers.get('content-type')?.startsWith('image/'))throw new Error('Could not download '+name);
  await writeFile(`public/images/editorial/${name}.jpg`,Buffer.from(await r.arrayBuffer()));
  console.log('Saved '+name+'.jpg');
}
