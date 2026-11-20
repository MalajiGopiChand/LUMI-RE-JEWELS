import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {placement,type Point} from './try-on';
import type {Product} from './catalogue';

export type FitCalibration={scale?:number;screenOffset?:[number,number]};
/** A transparent, pixel-aligned 3D layer shared by live and photo previews. */
export class TryOnRenderer {
  private renderer:THREE.WebGLRenderer;
  private scene=new THREE.Scene();
  private camera=new THREE.OrthographicCamera(0,1,1,0,-5000,5000);
  private roots:THREE.Group[]=[];
  private version=0;
  private environment:THREE.WebGLRenderTarget;
  private width=0;
  private height=0;
  private skinMask=new THREE.Mesh(new THREE.SphereGeometry(1,32,24),new THREE.MeshBasicMaterial({colorWrite:false,depthWrite:true}));
  constructor(){
    this.renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});
    this.renderer.setClearColor(0,0);
    this.renderer.setPixelRatio(1);
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
    const pmrem=new THREE.PMREMGenerator(this.renderer),room=new RoomEnvironment();
    this.environment=pmrem.fromScene(room,.04);this.scene.environment=this.environment.texture;
    room.dispose();pmrem.dispose();
    this.scene.add(new THREE.HemisphereLight(0xffffff,0x80664a,2));
    this.skinMask.visible=false;this.skinMask.renderOrder=-1;this.scene.add(this.skinMask);
    const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(-200,400,1000);this.scene.add(light);
  }
  private release(roots:THREE.Group[]){
    for(const root of roots){this.scene.remove(root);root.traverse(node=>{if(node instanceof THREE.Mesh){node.geometry.dispose();for(const m of Array.isArray(node.material)?node.material:[node.material]){for(const value of Object.values(m))if(value instanceof THREE.Texture)value.dispose();m.dispose();}}});}
  }
  private clear(){
    this.release(this.roots);
    this.roots=[];
  }
  async load(product:Product){
    const version=++this.version;this.clear();
    if(!product.model3D)throw new Error('This piece needs a GLB model for 3D try-on.');
    const url=product.sample?product.model3D+(product.model3D.includes('?')?'&':'?')+'fit=2':product.model3D;
    const {scene}=await new GLTFLoader().loadAsync(url);
    // Local concept earring assets contain a pair, separated along the X axis.
    const paired=product.tryOnCalibration?.paired??(!!product.sample&&product.category==='Earrings');
    const groups=paired?[new THREE.Group(),new THREE.Group()]:[new THREE.Group()];
    scene.updateMatrixWorld(true);
    scene.traverse(node=>{
      if(!(node instanceof THREE.Mesh))return;
      const copy=node.clone();copy.geometry=node.geometry.clone();
      copy.material=Array.isArray(node.material)?node.material.map(m=>m.clone()):node.material.clone();
      copy.geometry.applyMatrix4(node.matrixWorld);copy.position.set(0,0,0);copy.rotation.set(0,0,0);copy.scale.set(1,1,1);
      const box=new THREE.Box3().setFromObject(copy);
      groups[paired&&box.getCenter(new THREE.Vector3()).x>0?1:0].add(copy);
    });
    scene.traverse(node=>{if(node instanceof THREE.Mesh){node.geometry.dispose();for(const material of Array.isArray(node.material)?node.material:[node.material])material.dispose();}});
    if(product.category==='Earrings'&&!paired){
      const copy=groups[0].clone(true);copy.traverse(node=>{if(node instanceof THREE.Mesh){node.geometry=node.geometry.clone();node.material=Array.isArray(node.material)?node.material.map(m=>m.clone()):node.material.clone();}});groups.push(copy);
    }
    for(const group of groups){
      const bounds=new THREE.Box3().setFromObject(group),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
      if(!Number.isFinite(size.x)||size.x<=0)continue;
      const hanging=product.category==='Earrings'||product.category==='Necklaces';
      for(const child of group.children)child.position.set(-center.x,-(hanging?bounds.max.y:center.y),-center.z);
      group.userData.size=size;group.visible=false;
    }
    if(version!==this.version){this.release(groups);return false;}
    this.roots=groups;groups.forEach(group=>this.scene.add(group));return true;
  }
  draw(ctx:CanvasRenderingContext2D,product:Product,points:Point[]|undefined,calibration:FitCalibration,show=true){
    const {width,height}=ctx.canvas;
    if(width!==this.width||height!==this.height){this.width=width;this.height=height;this.renderer.setSize(width,height,false);this.camera.right=width;this.camera.top=height;this.camera.updateProjectionMatrix();}
    this.roots.forEach(root=>root.visible=false);
    this.skinMask.visible=false;
    const places=show?placement(product.category,points,{width,height},true):[];
    const config=product.tryOnCalibration;
    places.forEach((place,i)=>{
      const root=this.roots[i%this.roots.length];if(!root?.userData.size)return;
      const size=root.userData.size as THREE.Vector3;
      const scale=Math.min(place.width*width/size.x,place.maxHeight===undefined?Infinity:place.maxHeight*height/size.y)*(calibration.scale??1)*(config?.scale??1);
      const offset=config?.offset??[0,0,0],rotation=config?.rotation??[0,0,0];
      root.visible=true;root.position.set((place.x+(calibration.screenOffset?.[0]??0))*width+offset[0]*scale,height-(place.y+(calibration.screenOffset?.[1]??0))*height-offset[1]*scale,offset[2]*scale);
      root.scale.setScalar(scale);
      const facial=points&&points.length>33;
      const left=product.category==='Earrings'||facial?points?.[234]:product.category==='Necklaces'?points?.[11]:undefined;
      const right=product.category==='Earrings'||facial?points?.[454]:product.category==='Necklaces'?points?.[12]:undefined;
      const yaw=left&&right?Math.atan2(((right.z??0)-(left.z??0))*width,Math.abs(right.x-left.x)*width):0;
      const top=points?.[10],chin=points?.[152];
      const pitch=product.category==='Earrings'&&top&&chin?Math.atan2(((chin.z??0)-(top.z??0))*width,Math.abs(chin.y-top.y)*height):0;
      root.rotation.set(rotation[0]+pitch,rotation[1]+yaw,rotation[2]-place.rotation);
      if((product.category==='Bracelets'||product.category==='Rings')&&points?.[0]&&points?.[9]){
        const a=product.category==='Rings'?(points[13]??points[0]):points[0],b=product.category==='Rings'?(points[14]??points[9]):points[9];
        // Ring plane is perpendicular to the wrist/finger axis, including depth.
        const direction=new THREE.Vector3((b.x-a.x)*width,-(b.y-a.y)*height,-((b.z??0)-(a.z??0))*width).normalize();
        // Keep the gemstone on the camera-facing side of the finger, and use
        // the same untitled ring plane for band and stones.
        const front=new THREE.Vector3(0,0,1).addScaledVector(direction,-direction.z).normalize();
        if(front.lengthSq()<.01)front.set(0,1,0);
        const across=new THREE.Vector3().crossVectors(front,direction).normalize();
        root.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(across,front,direction));
        root.rotateX(rotation[0]);root.rotateY(rotation[1]);root.rotateZ(rotation[2]);
        const diameter=size.x*scale;
        this.skinMask.visible=true;this.skinMask.position.copy(root.position);
        this.skinMask.scale.set(diameter*.42,diameter*(product.category==='Rings'?.65:.55),diameter*.39);
        this.skinMask.rotation.set(0,0,-place.rotation);
      }
    });
    this.renderer.render(this.scene,this.camera);ctx.drawImage(this.renderer.domElement,0,0,width,height);
  }
  dispose(){this.version++;this.clear();this.skinMask.geometry.dispose();this.skinMask.material.dispose();this.environment.dispose();this.renderer.dispose();this.renderer.forceContextLoss();}
}
