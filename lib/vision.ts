import type {Point} from './try-on';
export type Landmark=Point&{index:number;z:number;visibility?:number;presence?:number};
export type VisionResult={engine:string;width:number;height:number;faces:Landmark[][];faceExpressions:{name:string;score:number}[][];faceTransforms:number[][][];hands:{landmarks:Landmark[];worldLandmarks:Landmark[];handedness:{label:string;score:number}[]}[];poses:{landmarks:Landmark[];worldLandmarks:Landmark[]}[];note:string};
export function visionPoints(result:VisionResult,category:string):Landmark[]|undefined{return category==='Earrings'?result.faces[0]:category==='Necklaces'?result.poses[0]?.landmarks:result.hands[0]?.landmarks;}
