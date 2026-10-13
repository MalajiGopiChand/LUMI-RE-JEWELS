import {mkdir,copyFile,readdir,writeFile} from 'node:fs/promises';
await mkdir('public/mediapipe/wasm',{recursive:true});
for(const file of await readdir('node_modules/@mediapipe/tasks-vision/wasm'))await copyFile('node_modules/@mediapipe/tasks-vision/wasm/'+file,'public/mediapipe/wasm/'+file);
const models={face:'face_landmarker/face_landmarker',hand:'hand_landmarker/hand_landmarker',pose:'pose_landmarker/pose_landmarker_lite'};
for(const[kind,path]of Object.entries(models)){
  const r=await fetch(`https://storage.googleapis.com/mediapipe-models/${path}/float16/1/${path.split('/')[1]}.task`,{signal:AbortSignal.timeout(120000)});
  if(!r.ok)throw new Error('Tracking model download failed: '+kind);
  const data=Buffer.from(await r.arrayBuffer());await writeFile(`public/mediapipe/${kind}.task`,data);console.log('Saved local '+kind+' tracking model.');
}
