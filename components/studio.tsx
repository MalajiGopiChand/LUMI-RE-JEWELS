'use client';
import {useEffect,useRef,useState,Suspense,Component,type ReactNode} from 'react';
import {Canvas} from '@react-three/fiber';
import {OrbitControls,Environment,Lightformer,useGLTF,Center,Html} from '@react-three/drei';
import {Camera,Upload,RotateCcw,Download,Trash2,Move,ArrowRight,ImagePlus,ShoppingBag,ScanFace} from 'lucide-react';
import {useSearchParams} from 'next/navigation';
import Link from 'next/link';
import {type Product,money,categories} from '@/lib/catalogue';
import {placement,trackerKind,smoothLandmarks,type Point} from '@/lib/try-on';
import {JewelleryImage} from './jewellery-image';
import {useStore} from './store';
import {FaceScan} from './face-scan';
import {faceEdit,type FaceProfile} from '@/lib/face-style';
import {visionPoints,type VisionResult} from '@/lib/vision';
import {LandmarkReport} from './landmark-report';

class ModelBoundary extends Component<{children:ReactNode;fallback:ReactNode},{failed:boolean}>{
  state={failed:false};static getDerivedStateFromError(){return {failed:true};}
  render(){return this.state.failed?this.props.fallback:this.props.children;}
}
function Model({url}:{url:string}){const {scene}=useGLTF(url);return <Center><primitive object={scene}/></Center>;}
type Overlay={image:HTMLImageElement;left:number;top:number;width:number;height:number};
type Controls={show:boolean};
const defaultControls:Controls={show:true};

export function Studio({products,mode}:{products:Product[];mode:'3d'|'ar'}){
  const params=useSearchParams(),{add,toast}=useStore();
  const requestedId=params.get('product');
  const [id,setId]=useState(params.get('product')||products[0]?.id);
  const [category,setCategory]=useState('All');
  const p=products.find(p=>p.id===id)||products[0];
  const [error,setError]=useState(''),[busy,setBusy]=useState(false),[camera,setCamera]=useState(false);
  const [photo,setPhoto]=useState(''),[status,setStatus]=useState('Choose a sample photo, upload a photo, or start your camera.');
  const [controls,setControls]=useState<Controls>(defaultControls),[assetReady,setAssetReady]=useState(false);
  const [modelKey,setModelKey]=useState(0),[demo,setDemo]=useState(false);
  const [profile,setProfile]=useState<FaceProfile|null>(null),[scanPhoto,setScanPhoto]=useState('');
  const [pendingPhoto,setPendingPhoto]=useState<{id:string;url:string;data?:VisionResult}|null>(null);
  const [scanResult,setScanResult]=useState<VisionResult|null>(null),[showPoints,setShowPoints]=useState(true);
  const previewVision=useRef<VisionResult|undefined>(undefined);
  const loadedAssetId=useRef('');
  const video=useRef<HTMLVideoElement>(null),canvas=useRef<HTMLCanvasElement>(null);
  const stream=useRef<MediaStream|null>(null),frame=useRef(0),generation=useRef(0),running=useRef(false);
  const tracker=useRef<any>(null),source=useRef<HTMLImageElement|null>(null),overlay=useRef<Overlay|null>(null),points=useRef<Point[]|undefined>(undefined);
  const options=useRef(controls);options.current=controls;
  const selected=useRef(p);selected.current=p;
  const engineKind=useRef(''),trackerVersion=useRef(0);
  const pointsVisible=useRef(showPoints);pointsVisible.current=showPoints;

  function stop(){
    generation.current++;trackerVersion.current++;running.current=false;
    stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;
    cancelAnimationFrame(frame.current);tracker.current?.close();tracker.current=null;
    setCamera(false);setBusy(false);
  }
  function clear(){stop();setPhoto('');source.current=null;points.current=undefined;previewVision.current=undefined;setError('');setDemo(false);setStatus('Choose a sample photo, upload a photo, or start your camera.');}
  useEffect(()=>()=>{generation.current++;trackerVersion.current++;running.current=false;stream.current?.getTracks().forEach(t=>t.stop());cancelAnimationFrame(frame.current);tracker.current?.close();},[]);
  useEffect(()=>{if(camera&&video.current&&stream.current){video.current.srcObject=stream.current;video.current.play().catch(()=>setError('Camera playback could not start. Try uploading a photo.'));}},[camera]);
  useEffect(()=>()=>{if(photo.startsWith('blob:'))URL.revokeObjectURL(photo);},[photo]);
  useEffect(()=>{if(requestedId&&products.some(p=>p.id===requestedId))setId(requestedId);},[requestedId]);

  useEffect(()=>{
    let disposed=false;setAssetReady(false);overlay.current=null;
    const url=p?.tryOnAsset;
    if(!url)return;
    const image=new Image();image.crossOrigin='anonymous';
    image.onload=()=>{
      if(disposed)return;
      try{
        const scratch=document.createElement('canvas');scratch.width=image.naturalWidth;scratch.height=image.naturalHeight;
        const context=scratch.getContext('2d')!;context.drawImage(image,0,0);
        const pixels=context.getImageData(0,0,scratch.width,scratch.height).data;
        let l=scratch.width,t=scratch.height,r=0,b=0;
        for(let y=0;y<scratch.height;y+=2)for(let x=0;x<scratch.width;x+=2){if(pixels[(y*scratch.width+x)*4+3]>20){l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x);b=Math.max(b,y);}}
        overlay.current={image,left:l,top:t,width:Math.max(1,r-l+2),height:Math.max(1,b-t+2)};
      }catch{overlay.current={image,left:0,top:0,width:image.naturalWidth,height:image.naturalHeight};}
      loadedAssetId.current=p.id;setAssetReady(true);
    };
    image.onerror=()=>{if(!disposed)setError('This preview asset could not load. Choose another piece.');};image.src=url;
    return()=>{disposed=true;};
  },[p?.id,p?.tryOnAsset]);
  useEffect(()=>{if(pendingPhoto&&assetReady&&loadedAssetId.current===pendingPhoto.id&&p?.id===pendingPhoto.id){setPendingPhoto(null);photoFrom(pendingPhoto.url,false,pendingPhoto.data).then(()=>canvas.current?.scrollIntoView({behavior:'smooth',block:'center'}));}},[pendingPhoto,assetReady,p?.id]);

  useEffect(()=>{
    setControls(defaultControls);setError('');
    if(camera&&engineKind.current!==trackerKind(p.category))void prepareCameraTracker(generation.current);
    else if(source.current){
      if(previewVision.current){points.current=visionPoints(previewVision.current,p.category);setStatus(points.current?'Aligned to your detected landmarks.':'Show the body area for this piece and scan again.');draw(source.current);}
      else void trackPhoto(generation.current);
    }
  },[id]);

  function draw(src:HTMLImageElement|HTMLVideoElement){
    const c=canvas.current;if(!c)return;
    const w=src instanceof HTMLVideoElement?src.videoWidth:src.naturalWidth,h=src instanceof HTMLVideoElement?src.videoHeight:src.naturalHeight;
    if(!w||!h)return;
    const ratio=Math.min(1,1600/w,1600/h);c.width=Math.round(w*ratio);c.height=Math.round(h*ratio);
    const ctx=c.getContext('2d')!;ctx.drawImage(src,0,0,c.width,c.height);
    if(previewVision.current&&pointsVisible.current){
      const result=previewVision.current;
      const groups=[...result.faces.map(points=>({points,color:'#5eead4',radius:1.5,checkVisibility:false})),...result.hands.map(h=>({points:h.landmarks,color:'#fbbf24',radius:3,checkVisibility:false})),...result.poses.map(p=>({points:p.landmarks,color:'#a78bfa',radius:3,checkVisibility:true}))];
      for(const group of groups){ctx.fillStyle=group.color;for(const point of group.points){if(group.checkVisibility&&point.visibility!==undefined&&point.visibility<.5)continue;ctx.beginPath();ctx.arc(point.x*c.width,point.y*c.height,group.radius,0,Math.PI*2);ctx.fill();}}
    }
    const o=overlay.current,v=options.current;if(!o||!v.show)return;
    const piece=selected.current;
    const places=placement(piece.category,points.current,{width:c.width,height:c.height},true);
    for(const place of places){
      const aspect=o.height/o.width;
      const proposedWidth=place.width*c.width;
      const width=Math.min(proposedWidth,place.maxHeight===undefined?proposedWidth:place.maxHeight*c.height/aspect),height=width*aspect;
      ctx.save();ctx.translate(place.x*c.width,place.y*c.height);ctx.rotate(place.rotation);
      const originY=piece.category==='Necklaces'?-height*.08:piece.category==='Earrings'&&aspect>1.7?-height*.1:-height/2;
      ctx.drawImage(o.image,o.left,o.top,o.width,o.height,-width/2,originY,width,height);ctx.restore();
    }
  }
  useEffect(()=>{if(source.current&&!camera)draw(source.current);},[controls,assetReady,id,photo,camera,showPoints]);

  async function init(videoMode:boolean,kind=trackerKind(selected.current.category)){
    const vision=await import('@mediapipe/tasks-vision');
    const files=await vision.FilesetResolver.forVisionTasks('/mediapipe/wasm');
    const settings={baseOptions:{modelAssetPath:`/mediapipe/${kind}.task`},runningMode:(videoMode?'VIDEO':'IMAGE') as 'VIDEO'|'IMAGE'};
    return kind==='face'?vision.FaceLandmarker.createFromOptions(files,settings):kind==='pose'?vision.PoseLandmarker.createFromOptions(files,settings):vision.HandLandmarker.createFromOptions(files,settings);
  }
  function extract(result:any):Point[]|undefined{return (result.faceLandmarks||result.landmarks)?.[0];}
  async function prepareCameraTracker(current:number){
    const version=++trackerVersion.current,kind=trackerKind(selected.current.category);
    engineKind.current=kind;points.current=undefined;tracker.current?.close();tracker.current=null;
    setBusy(true);setStatus('Finding landmarks for this piece…');
    try{const engine=await init(true,kind);if(current!==generation.current||version!==trackerVersion.current){engine.close();return;}tracker.current=engine;}
    catch{if(current===generation.current&&version===trackerVersion.current)setStatus('Tracking could not load. Try a photo or restart the camera.');}
    finally{if(current===generation.current&&version===trackerVersion.current)setBusy(false);}
  }
  async function trackPhoto(current:number){
    if(!source.current)return;
    const version=++trackerVersion.current,image=source.current,kind=trackerKind(selected.current.category);
    points.current=undefined;draw(image);setBusy(true);setStatus('Finding landmarks…');
    try{
      const engine=await init(false,kind);
      if(current!==generation.current||version!==trackerVersion.current){engine.close();return;}
      try{points.current=extract(engine.detect(image));}finally{engine.close();}
      setStatus(points.current?'Aligned to your detected landmarks.':'No landmarks found. Use a clear photo showing your face, shoulders or hand.');
    }catch{if(current===generation.current&&version===trackerVersion.current){points.current=undefined;setStatus('Tracking could not load. Try scanning or choose another photo.');}}
    finally{if(current===generation.current&&version===trackerVersion.current){setBusy(false);draw(image);}}
  }
  async function photoFrom(url:string,isDemo=false,data?:VisionResult){
    stop();const current=generation.current;source.current=null;previewVision.current=data;setError('');setDemo(isDemo);setPhoto(url);setControls(defaultControls);points.current=undefined;
    try{
      const image=new Image();image.crossOrigin='anonymous';
      await new Promise<void>((resolve,reject)=>{image.onload=()=>resolve();image.onerror=()=>reject(new Error('This photo could not be opened. Please choose another.'));image.src=url;});
      if(current!==generation.current)return;
      if(image.naturalWidth*image.naturalHeight>24000000)throw new Error('Choose a photo smaller than 24 megapixels.');
      source.current=image;
      if(data){points.current=visionPoints(data,selected.current.category);setStatus(points.current?'Aligned to your detected landmarks.':'Show the body area for this piece and scan again.');draw(image);}else{draw(image);await trackPhoto(current);}
    }catch(e){if(current===generation.current){setPhoto('');source.current=null;setError((e as Error).message);}}
  }
  async function upload(file:File){
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>10*1024*1024){setError('Choose a JPEG, PNG or WebP under 10 MB.');return;}
    await photoFrom(URL.createObjectURL(file));
  }
  async function start(){
    clear();const current=generation.current;setBusy(true);setError('');
    try{
      if(!navigator.mediaDevices?.getUserMedia)throw new Error('This browser cannot open a camera. Upload a photo instead.');
      const s=await navigator.mediaDevices.getUserMedia({video:{facingMode:p.category==='Earrings'||p.category==='Necklaces'?'user':'environment',width:{ideal:960}},audio:false});
      if(current!==generation.current){s.getTracks().forEach(t=>t.stop());return;}
      stream.current=s;running.current=true;setCamera(true);setStatus('Preparing local camera tracking…');
      await prepareCameraTracker(current);
      if(current!==generation.current)return;
      let last=-1,lastDetection=0;
      const tick=()=>{
        if(!running.current||current!==generation.current)return;
        const v=video.current;
        if(v&&v.readyState>=2&&v.currentTime!==last){
          last=v.currentTime;
          if(tracker.current&&performance.now()-lastDetection>100){
            lastDetection=performance.now();try{points.current=smoothLandmarks(points.current,extract(tracker.current.detectForVideo(v,lastDetection)));setStatus(points.current?'Following your position automatically.':'Move your face, shoulders or hand into view.');}catch{points.current=undefined;setStatus('Tracking lost. Move into view to realign.');}
          }
          draw(v);
        }
        frame.current=requestAnimationFrame(tick);
      };tick();
    }catch(e){if(current===generation.current){stop();setError((e as Error).name==='NotAllowedError'?'Camera access was declined. You can upload a photo or try a sample.':(e as Error).message);}}
  }
  function capture(){
    try{if(!canvas.current)throw new Error('Choose a photo or start your camera first.');const a=document.createElement('a');a.download=`carla-diamonds-${p.slug}-preview.png`;a.href=canvas.current.toDataURL('image/png');a.click();toast('Preview saved to your device.');}
    catch(e){setError((e as Error).message||'The preview could not be saved.');}
  }
  function update(key:keyof Controls,value:boolean){setControls(c=>({...c,[key]:value}));}
  if(!p)return <section className="empty"><h1>Your collection is being prepared.</h1><Link className="button" href="/shop">Browse jewellery</Link></section>;
  const active=camera||!!photo;
  const edit=profile?faceEdit(profile,products):null;
  function tryPiece(piece:Product){
    setCategory(piece.category);setId(piece.id);
    if(camera||source.current)return;
    if(scanPhoto&&(piece.category==='Earrings'||piece.category==='Necklaces'||scanResult?.hands.length))setPendingPhoto({id:piece.id,url:scanPhoto,data:scanResult||undefined});
    else if(profile){clear();setStatus('Show your hand or wrist, or use the sample hand photo to try this piece.');}
  }
  function completeScan(result:FaceProfile|null,url:string,data?:VisionResult){
    clear();setProfile(result);setScanPhoto(url);setScanResult(data||null);setShowPoints(true);
    const target=result?faceEdit(result,products).products[0]:products.find(p=>p.category===(data?.hands.length?'Rings':'Necklaces')&&p.tryOnAsset&&p.variants.some(v=>v.stock>0));
    if(target){setCategory(target.category);setId(target.id);setPendingPhoto({id:target.id,url,data});}
  }
  const fallback=<><JewelleryImage src={p.images[0]} alt={p.name}/><p className="canvas-note">The 3D model could not load. Product image shown.</p></>;
  return <>
    <div className="page-title"><p className="eyebrow">THE CARLA DIAMONDS DISCOVERY STUDIO</p><h1>{mode==='3d'?'Beauty, from every angle.':'Find your kind of radiance.'}</h1><p>{mode==='3d'?'Explore a design in three dimensions.':'Choose a piece. Preview it on a sample, a photo, or your camera.'}</p></div>
    <div className="studio-tabs"><Link className={mode==='ar'?'active':''} href={'/virtual-try-on?product='+p.id}><ScanFace size={16}/> Virtual try-on</Link><Link className={mode==='3d'?'active':''} href={'/viewer?product='+p.id}><RotateCcw size={16}/> 3D discovery</Link></div>
    {mode==='ar'&&<><FaceScan onBegin={stop} onClear={()=>{setScanResult(null);setProfile(null);setScanPhoto('');setPendingPhoto(null);clear();}} onComplete={completeScan}/>{edit&&<section className="section face-edit" aria-label="Face scan recommendations"><p className="eyebrow">YOUR PERSONAL FACE EDIT · {profile!.proportion.toUpperCase()} PROPORTIONS</p><h2>A little inspiration, shaped around you.</h2><p>{edit.reason} These are styling suggestions; choose what you love.</p><p className="muted">Earrings and necklaces use your scanned portrait. Rings and bracelets need a hand or wrist photo.</p><div className="studio-product-grid">{edit.products.map(item=><button key={item.id} onClick={()=>tryPiece(item)}><JewelleryImage src={item.images[0]} alt={item.name}/><span>{item.name}</span><small>{money(item.price)}</small><strong>Preview {item.category==='Rings'||item.category==='Bracelets'?'on hand':'on my photo'}</strong></button>)}</div></section>}</>}
    <section className="section studio-layout">
      <div><div className={'studio-canvas '+(!active?'product-only':'')}>
        {mode==='3d'&&p.model3D?<ModelBoundary key={p.id+modelKey} fallback={fallback}>
          <Canvas camera={{position:[0,0,5],fov:40}}><color attach="background" args={['#f1ece5']}/><ambientLight intensity={1.2}/><directionalLight position={[4,4,4]} intensity={4}/><directionalLight position={[-3,2,2]} intensity={2}/><Suspense fallback={<Html center><span className="notice">Loading design…</span></Html>}><Model url={p.model3D}/></Suspense><Environment resolution={128}><Lightformer intensity={3} position={[0,3,3]} scale={[5,5,1]}/><Lightformer intensity={2} position={[-4,1,1]} rotation={[0,Math.PI/2,0]} scale={[5,3,1]}/></Environment><OrbitControls enablePan={false} minDistance={1} maxDistance={15}/></Canvas>
          <span className="canvas-note"><Move size={14}/> Drag to rotate · Scroll to zoom</span>
        </ModelBoundary>:mode==='ar'&&active?<><video ref={video} muted playsInline className="tracking-video"/><canvas ref={canvas} aria-label="Jewellery preview"/><span className="canvas-note">{demo?'Sample model · ':''}{status}</span></>:<><JewelleryImage src={p.images[0]} alt={p.name}/><span className="canvas-note">{mode==='3d'?'Product image':'Your preview starts here · Camera is off'}</span></>}
      </div><p className="studio-privacy">{scanResult?"Python scan frames are processed in memory by the vision service. Clear your scan and photo whenever you like.":"Browser previews keep photos and camera frames on this device. Clear your photo whenever you like."}</p></div>
      <div className="studio-controls"><p className="eyebrow">YOUR CHOSEN PIECE</p>
        <div className="form-grid"><label>Category<select value={category} onChange={e=>{setCategory(e.target.value);const found=products.find(p=>e.target.value==='All'||p.category===e.target.value);if(found)tryPiece(found);}}>{['All',...categories.map(c=>c.name)].map(c=><option key={c}>{c}</option>)}</select></label><label>Select jewellery<select value={id} onChange={e=>{const found=products.find(p=>p.id===e.target.value);if(found)tryPiece(found);}}>{products.filter(p=>category==='All'||p.category===category).map(p=><option value={p.id} key={p.id}>{p.name}</option>)}</select></label></div>
        <h2>{p.name}</h2><strong>{money(p.price)}</strong><p>{p.description}</p>
        {mode==='ar'?<>
          {p.sample&&<div className="studio-disclaimer">Concept preview · AI-created jewellery designs. Placement is approximate; use measurements for fit.</div>}
          {!p.tryOnAsset?<div className="notice">This piece has no try-on asset. Choose another piece to preview.</div>:<>
            <button className="button outline" disabled={!assetReady||busy} onClick={()=>photoFrom(p.category==='Rings'||p.category==='Bracelets'?'/images/editorial/hand-preview.png':'/images/editorial/portrait-preview.png',true)}><ImagePlus size={17}/> Try a sample photo</button>
            <div className="studio-inputs"><button className="button" disabled={!assetReady||busy} onClick={camera?()=>{stop();setStatus('Camera stopped.');}:start}><Camera size={16}/>{camera?'Stop camera':busy?'Preparing…':'Start camera'}</button><label className={'button outline '+(!assetReady||busy?'disabled':'')}><Upload size={16}/> Upload photo<input type="file" className="sr-only" accept="image/jpeg,image/png,image/webp" disabled={!assetReady||busy} onChange={e=>{const file=e.target.files?.[0];if(file)upload(file);e.target.value='';}}/></label></div>
            {!assetReady&&<small>Loading jewellery preview…</small>}
          </>}
          {active&&<div className="preview-adjustments"><h3>Aligned automatically.</h3><p className="muted" role="status">{status}</p>
            {previewVision.current&&<label className="check-row"><input type="checkbox" checked={showPoints} onChange={e=>setShowPoints(e.target.checked)}/> Show detected points</label>}
            <div className="studio-inputs"><button className="button outline" onClick={()=>update('show',!controls.show)}>{controls.show?'Before / without jewellery':'After / with jewellery'}</button><button className="button outline" onClick={capture}><Download size={15}/> Save preview</button></div>
            {photo&&!previewVision.current&&<button className="text-link" disabled={busy} onClick={()=>trackPhoto(generation.current)}>Scan photo again</button>}
            <button className="text-link" onClick={()=>{setScanResult(null);setProfile(null);setScanPhoto('');setPendingPhoto(null);clear();}}><Trash2 size={15}/> Clear photo & stop camera</button>
          </div>}
          <small>Camera permission is requested only when you press Start camera. Tracking does not verify size, skin tone, fit or occlusion.</small>
        </>:<><div className="studio-disclaimer">{p.sample?'Illustrative 3D design study · Shape and proportions are approximate.':'Lighting and screen colour may vary. Confirm dimensions in the product details.'}</div><button className="button outline" onClick={()=>setModelKey(k=>k+1)}><RotateCcw size={16}/> Reset view</button></>}
        {error&&<p className="error" role="alert">{error}</p>}
        <div className="studio-purchase"><Link className="button" href={'/product/'+p.slug}>Choose size & details <ArrowRight size={16}/></Link>{p.category!=='Rings'&&<button className="button outline" onClick={()=>add(p)}><ShoppingBag size={16}/> Add to bag</button>}</div>
      </div>
    </section>
    {mode==='ar'&&scanResult&&<LandmarkReport data={scanResult}/>}
    <section className="section studio-selection"><div className="section-heading"><div><p className="eyebrow">A DIFFERENT KIND OF BEAUTIFUL</p><h2>Try another little treasure.</h2></div></div><div className="studio-product-grid">{products.filter(x=>x.category===p.category).map(x=><button key={x.id} className={x.id===p.id?'active':''} onClick={()=>tryPiece(x)}><JewelleryImage src={x.images[0]} alt={x.name}/><span>{x.name}</span><small>{money(x.price)}</small></button>)}</div></section>
  </>;
}






