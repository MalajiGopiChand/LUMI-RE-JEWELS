'use client';
import {useEffect,useRef,useState} from 'react';
import {Camera,ScanFace,Upload,X} from 'lucide-react';
import {faceProfile,type FaceProfile} from '@/lib/face-style';
import type {VisionResult} from '@/lib/vision';

export function FaceScan({onComplete,onClear,onBegin}:{onComplete:(profile:FaceProfile|null,photo:string,data?:VisionResult)=>void;onClear:()=>void;onBegin:()=>void}){
  const [open,setOpen]=useState(false),[live,setLive]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
  const video=useRef<HTMLVideoElement>(null),stream=useRef<MediaStream|null>(null),generation=useRef(0);
  const [usePython,setUsePython]=useState(true);
  function stop(){generation.current++;stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;setLive(false);setBusy(false);}
  useEffect(()=>()=>{generation.current++;stream.current?.getTracks().forEach(t=>t.stop());},[]);
  useEffect(()=>{if(live&&video.current&&stream.current){video.current.srcObject=stream.current;video.current.play().catch(()=>setMessage('Camera playback failed. Upload a portrait instead.'));}},[live]);
  async function camera(){stop();const current=generation.current;setBusy(true);setMessage('');try{
    if(!navigator.mediaDevices?.getUserMedia)throw new Error('Camera is unavailable. Upload a portrait or use the sample.');
    const media=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:960}},audio:false});
    if(current!==generation.current){media.getTracks().forEach(t=>t.stop());return;}stream.current=media;setLive(true);
  }catch(e){if(current===generation.current)setMessage((e as Error).name==='NotAllowedError'?'Camera access was declined. Upload a portrait or use the sample.':(e as Error).message);}finally{if(current===generation.current)setBusy(false);}}
  async function scan(input:HTMLImageElement|HTMLVideoElement){
    const current=generation.current;setBusy(true);setMessage('Scanning face proportions on this device…');let engine:any;
    try{
      const width=input instanceof HTMLVideoElement?input.videoWidth:input.naturalWidth,height=input instanceof HTMLVideoElement?input.videoHeight:input.naturalHeight;
      if(!width||!height)throw new Error('Wait for the camera image, then scan again.');
      if(width*height>24000000)throw new Error('Choose a portrait smaller than 24 megapixels.');
      const snapshot=document.createElement('canvas'),scale=Math.min(1,1200/width,1200/height);snapshot.width=Math.round(width*scale);snapshot.height=Math.round(height*scale);snapshot.getContext('2d')!.drawImage(input,0,0,snapshot.width,snapshot.height);
      if(usePython){
        const blob=await new Promise<Blob>((resolve,reject)=>snapshot.toBlob(b=>b?resolve(b):reject(new Error('Could not prepare this photo.')),'image/jpeg',.9));
        const response=await fetch('/api/vision/analyze',{method:'POST',headers:{'Content-Type':'image/jpeg'},body:blob});
        const data=await response.json();if(!response.ok)throw new Error(data.error);
        if(current!==generation.current)return;
        const result=data as VisionResult;
        if(result.faces.length>1)throw new Error('Use one person at a time for jewellery styling.');
        if(!result.faces.length&&!result.hands.length&&!result.poses.length)throw new Error('No face, hand or body landmarks found. Use a clearer photo.');
        const profile=faceProfile(result.faces[0],result.width,result.height);
        const photo=snapshot.toDataURL('image/jpeg',.92);stop();onComplete(profile,photo,result);setMessage('Python scan complete. Landmark data and your preview are ready below.');return;
      }
      const vision=await import('@mediapipe/tasks-vision');
      engine=await vision.FaceLandmarker.createFromOptions(await vision.FilesetResolver.forVisionTasks('/mediapipe/wasm'),{baseOptions:{modelAssetPath:'/mediapipe/face.task'},runningMode:'IMAGE',numFaces:2});
      if(current!==generation.current)return;
      const faces=engine.detect(snapshot).faceLandmarks;
      if(faces.length!==1)throw new Error(faces.length?'Use a photo with only one face.':'No clear face found. Face the camera in good light, with your full face visible.');
      const profile=faceProfile(faces[0],snapshot.width,snapshot.height);
      if(!profile)throw new Error('Move closer and show your whole face, then scan again.');
      const photo=snapshot.toDataURL('image/jpeg',.92);stop();onComplete(profile,photo);setMessage('Scan complete. Your styling edit is ready below.');
    }catch(e){if(current===generation.current)setMessage((e as Error).message);}finally{engine?.close();if(current===generation.current)setBusy(false);}
  }
  async function load(url:string){stop();const current=generation.current;setBusy(true);setMessage('Opening portrait…');try{const image=new Image();await new Promise<void>((resolve,reject)=>{image.onload=()=>resolve();image.onerror=()=>reject(new Error('This photo could not be opened.'));image.src=url;});if(current===generation.current)await scan(image);}catch(e){if(current===generation.current){setMessage((e as Error).message);setBusy(false);}}finally{if(url.startsWith('blob:'))URL.revokeObjectURL(url);}}
  return <section className="face-scan section"><div className="face-scan-heading"><div><p className="eyebrow">YOUR LANDMARKS. YOUR PERSONAL EDIT.</p><h2>Scan. Discover. Try it on.</h2><p>Scan face and hand points, discover jewellery ideas, then preview your favourites.</p></div><button className="button outline" aria-expanded={open} onClick={()=>{if(open)stop();else onBegin();setOpen(!open);}}><ScanFace size={18}/>{open?'Close face scanner':'Scan face & hands'}</button></div>
    {open&&<div className="face-scan-panel"><div><label className="scan-engine">Scan engine<select value={usePython?'python':'browser'} disabled={busy||live} onChange={e=>setUsePython(e.target.value==='python')}><option value="python">Python · face, hands & body points</option><option value="browser">Browser · face proportions</option></select></label><p>Use good light and one person. Show your full face, hands or shoulders for the areas you want to scan.</p><div className="face-scan-actions"><button className="button" disabled={busy} onClick={camera}><Camera size={16}/> Open camera for face scan</button><label className="button outline"><Upload size={16}/> Upload portrait<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e=>{const f=e.target.files?.[0];e.target.value='';if(!f)return;if(!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>10*1024*1024){setMessage('Choose a JPEG, PNG or WebP under 10 MB.');return;}load(URL.createObjectURL(f));}}/></label><button className="text-link" disabled={busy} onClick={()=>load('/images/editorial/portrait-preview.png')}>Scan sample face</button>{usePython&&<button className="text-link" disabled={busy} onClick={()=>load('/images/editorial/hand-preview.png')}>Scan sample hand</button>}</div><p className="muted">{usePython?'Python mode sends this frame to the Python vision service for this website. Photos and results are processed in memory and are not saved.':'Browser mode processes the photo on this device.'} Styling and size estimates are approximate.</p><p role="status">{message}</p><button className="text-link" onClick={()=>{stop();setMessage('Scan and preview cleared.');onClear();}}><X size={14}/> Clear scan & photo</button></div>{live&&<div><video ref={video} muted playsInline className="face-scan-video"/><div className="face-scan-actions"><button className="button" disabled={busy} onClick={()=>{if(video.current)scan(video.current);}}>{busy?'Scanning…':'Scan this frame'}</button><button className="button outline" onClick={stop}>Stop camera</button></div></div>}</div>}
  </section>;
}


