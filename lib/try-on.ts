export type Point={x:number;y:number;z?:number;visibility?:number};
export type Placement={x:number;y:number;width:number;rotation:number;maxHeight?:number};
type Frame={width:number;height:number};
const usable=(p:Point|undefined)=>!!p&&Number.isFinite(p.x)&&Number.isFinite(p.y);

export function trackerKind(category:string){
  return category==='Earrings'||category==='Necklaces'?'face':'hand';
}

export function smoothLandmarks(previous:Point[]|undefined,next:Point[]|undefined,alpha=.45):Point[]|undefined{
  if(!next)return undefined;
  if(!previous||previous.length!==next.length)return next;
  return next.map((p,i)=>({...p,x:previous[i].x+(p.x-previous[i].x)*alpha,y:previous[i].y+(p.y-previous[i].y)*alpha}));
}

export function placement(category:string,points:Point[]|undefined,frame:Frame={width:1,height:1},strict=false):Placement[]{
  const has=(...ids:number[])=>ids.every(i=>usable(points?.[i]));
  const pixel=(i:number)=>({x:points![i].x*frame.width,y:points![i].y*frame.height});
  const output=(x:number,y:number,width:number,rotation:number,maxHeight?:number):Placement=>({
    x:x/frame.width,
    y:y/frame.height,
    width:width/frame.width,
    rotation,
    maxHeight:maxHeight===undefined?undefined:maxHeight/frame.height
  });

  if(category==='Earrings'&&has(234,454,10,152)){
    const l=pixel(234),r=pixel(454),top=pixel(10),chin=pixel(152);
    const span=Math.hypot(r.x-l.x,r.y-l.y),height=Math.hypot(chin.x-top.x,chin.y-top.y);
    if(span>0&&height>0){
      const ux=(r.x-l.x)/span,uy=(r.y-l.y)/span,dx=(chin.x-top.x)/height,dy=(chin.y-top.y)/height;
      const rotation=Math.atan2(uy,ux),width=span*.18;
      let ears=[
        output(l.x-ux*span*.035+dx*height*.085,l.y-uy*span*.035+dy*height*.085,width,rotation,height*.40),
        output(r.x+ux*span*.035+dx*height*.085,r.y+uy*span*.035+dy*height*.085,width,rotation,height*.40)
      ];
      if(has(1)){
        const nose=pixel(1),offset=((nose.x-(l.x+r.x)/2)*ux+(nose.y-(l.y+r.y)/2)*uy)/span;
        if(Math.abs(offset)>.24)ears=[ears[offset>0?1:0]];
      }
      return ears;
    }
  }

  if(category==='Necklaces'){
    // Case 1: Pose shoulders detected (points.length <= 33)
    if(has(11,12)){
      const visible=[11,12].every(i=>points![i].visibility===undefined||points![i].visibility!>=.5);
      const l=pixel(11),r=pixel(12),span=Math.hypot(r.x-l.x,r.y-l.y);
      if(visible&&span>0){
        let rotation=Math.atan2(r.y-l.y,r.x-l.x);
        if(rotation>Math.PI/2)rotation-=Math.PI;
        if(rotation< -Math.PI/2)rotation+=Math.PI;
        return [output((l.x+r.x)/2+Math.sin(rotation)*span*.1,(l.y+r.y)/2-Math.cos(rotation)*span*.1,span*.62,rotation,span*.7)];
      }
      if(strict&&points!.length<=33)return [];
    }

    // Case 2: Face mesh detected (portrait / selfie face tracking)
    if(has(234,454,10,152)){
      const l=pixel(234),r=pixel(454),top=pixel(10),chin=pixel(152);
      const span=Math.hypot(r.x-l.x,r.y-l.y),height=Math.hypot(chin.x-top.x,chin.y-top.y);
      if(span>0&&height>0){
        const ux=(r.x-l.x)/span,uy=(r.y-l.y)/span,dx=(chin.x-top.x)/height,dy=(chin.y-top.y)/height;
        const rotation=Math.atan2(uy,ux);
        // Position necklace naturally around user's neck below chin
        const neckX=chin.x+dx*height*.42;
        const neckY=chin.y+dy*height*.42;
        const chainWidth=span*1.55;
        const chainMaxHeight=height*.95;
        return [output(neckX,neckY,chainWidth,rotation,chainMaxHeight)];
      }
    }
  }

  if(category==='Rings'){
    if(has(13,14)){
      const a=pixel(13),b=pixel(14),span=Math.hypot(a.x-b.x,a.y-b.y);
      if(span>0)return [output(a.x+(b.x-a.x)*.32,a.y+(b.y-a.y)*.32,span*.6,Math.atan2(b.y-a.y,b.x-a.x)+Math.PI/2)];
    }
    // Fallback to middle finger joints if ring finger is occluded
    if(has(9,10)){
      const a=pixel(9),b=pixel(10),span=Math.hypot(a.x-b.x,a.y-b.y);
      if(span>0)return [output(a.x+(b.x-a.x)*.32,a.y+(b.y-a.y)*.32,span*.6,Math.atan2(b.y-a.y,b.x-a.x)+Math.PI/2)];
    }
  }

  if(category==='Bracelets'&&has(0,5,9,17)){
    const wrist=pixel(0),middle=pixel(9),left=pixel(5),right=pixel(17),length=Math.hypot(middle.x-wrist.x,middle.y-wrist.y),breadth=Math.hypot(right.x-left.x,right.y-left.y);
    if(length>0&&breadth>0)return [output(wrist.x-(middle.x-wrist.x)*.08,wrist.y-(middle.y-wrist.y)*.08,breadth*.85,Math.atan2(middle.y-wrist.y,middle.x-wrist.x)+Math.PI/2)];
  }

  if(strict)return [];
  if(category==='Earrings')return [{x:.34,y:.48,width:.08,rotation:0},{x:.66,y:.48,width:.08,rotation:0}];
  return [{x:.5,y:category==='Necklaces'?.68:category==='Bracelets'?.65:.5,width:category==='Necklaces'?.4:category==='Bracelets'?.24:.17,rotation:0}];
}
