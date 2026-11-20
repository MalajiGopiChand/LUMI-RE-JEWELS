import type {TrackedPoints} from './try-on';
type Source=HTMLVideoElement|HTMLImageElement|HTMLCanvasElement;
export type LocalTracker={detect:(source:Source)=>TrackedPoints|undefined;detectForVideo:(source:Source,time:number)=>TrackedPoints|undefined;close:()=>void};

/** Neck tracking shares face + shoulder evidence, including close-up portraits. */
export async function createLocalTracker(videoMode:boolean,kind:'face'|'pose'|'hand'):Promise<LocalTracker>{
  const vision=await import('@mediapipe/tasks-vision');
  const files=await vision.FilesetResolver.forVisionTasks('/mediapipe/wasm');
  const runningMode=videoMode?'VIDEO' as const:'IMAGE' as const;
  const attempt=async<T>(create:(delegate:'GPU'|'CPU')=>Promise<T>)=>{try{return await create('GPU');}catch{return create('CPU');}};
  const face=()=>attempt(delegate=>vision.FaceLandmarker.createFromOptions(files,{runningMode,numFaces:1,baseOptions:{modelAssetPath:'/mediapipe/face.task',delegate}}));
  if(kind==='face'){
    const engine=await face();return {detect:s=>engine.detect(s).faceLandmarks[0],detectForVideo:(s,t)=>engine.detectForVideo(s,t).faceLandmarks[0],close:()=>engine.close()};
  }
  if(kind==='hand'){
    const engine=await attempt(delegate=>vision.HandLandmarker.createFromOptions(files,{runningMode,numHands:1,baseOptions:{modelAssetPath:'/mediapipe/hand.task',delegate}}));
    return {detect:s=>engine.detect(s).landmarks[0],detectForVideo:(s,t)=>engine.detectForVideo(s,t).landmarks[0],close:()=>engine.close()};
  }
  const [poseResult,faceResult]=await Promise.allSettled([
    attempt(delegate=>vision.PoseLandmarker.createFromOptions(files,{runningMode,numPoses:1,baseOptions:{modelAssetPath:'/mediapipe/pose.task',delegate}})),face()
  ]);
  const pose=poseResult.status==='fulfilled'?poseResult.value:undefined;
  const facial=faceResult.status==='fulfilled'?faceResult.value:undefined;
  if(!pose&&!facial)throw new Error('Face and shoulder tracking could not load.');
  const combine=(posePoints:TrackedPoints|undefined,facePoints:TrackedPoints|undefined)=>{
    if(!posePoints)return facePoints;
    if(facePoints)posePoints.face=facePoints;
    return posePoints;
  };
  return {detect:s=>combine(pose?.detect(s).landmarks[0],facial?.detect(s).faceLandmarks[0]),detectForVideo:(s,t)=>combine(pose?.detectForVideo(s,t).landmarks[0],facial?.detectForVideo(s,t).faceLandmarks[0]),close:()=>{pose?.close();facial?.close();}};
}
