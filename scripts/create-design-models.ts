import * as THREE from 'three';
import {mkdir,writeFile} from 'node:fs/promises';
import {sampleProducts} from '../lib/catalogue';

// Illustrative concept geometry, never a dimensionally calibrated merchant model.
async function main(){
await mkdir('public/models',{recursive:true});
for(const p of sampleProducts){
  const meshes:THREE.Mesh[]=[];
  const metal=p.metal==='White gold'?[.76,.77,.79,1]:p.metal==='Rose gold'?[.78,.45,.34,1]:[.82,.58,.22,1];
  const materials=[{name:p.metal,pbrMetallicRoughness:{baseColorFactor:metal,metallicFactor:1,roughnessFactor:.23}},{name:'Stone',pbrMetallicRoughness:{baseColorFactor:p.gemstones.includes('Emerald')?[.02,.34,.19,1]:p.gemstones.includes('Ruby')?[.56,.015,.07,1]:p.gemstones.includes('Sapphire')?[.015,.1,.42,1]:[.92,.93,.95,1],metallicFactor:.15,roughnessFactor:.12}},{name:'Pearl',pbrMetallicRoughness:{baseColorFactor:[.91,.88,.8,1],metallicFactor:.12,roughnessFactor:.22}}];
  function part(g:THREE.BufferGeometry,material=0,pos=[0,0,0],scale=[1,1,1],rotation=[0,0,0]){const m=new THREE.Mesh(g);m.userData.material=material;m.position.set(...pos as [number,number,number]);m.scale.set(...scale as [number,number,number]);m.rotation.set(...rotation as [number,number,number]);m.updateMatrixWorld();meshes.push(m);return m;}
  const torus=(r:number,t:number,arc=Math.PI*2)=>new THREE.TorusGeometry(r,t,12,64,arc);
  const sphere=(r:number)=>new THREE.SphereGeometry(r,24,16);
  if(p.category==='Rings'){
    part(torus(.85,p.gemstones==='None'?.09:.045),0,[0,0,0],[1,1,1],[.55,.18,0]);
    if(p.gemstones!=='None')part(p.gemstones.includes('pearl')?sphere(.23):new THREE.OctahedronGeometry(.27,0),p.gemstones.includes('pearl')?2:1,[0,.69,.43],[1,p.gemstones.includes('Ruby')||p.gemstones.includes('Sapphire')?1.2:1,1]);
    if(p.name.includes('Entwined'))part(torus(.86,.048),0,[0,.02,.05],[1,1,1],[.65,.1,.12]);
  }else if(p.category==='Necklaces'){
    if(p.gemstones==='Freshwater pearls')for(let j=0;j<48;j++){const a=j/48*Math.PI*2;part(sphere(.056),2,[Math.cos(a)*.8,Math.sin(a)*1.2,0]);}
    else part(torus(.9,.013),0,[0,0,0],[.9,1.4,1]);
    if(p.name.includes('Layered'))part(torus(.7,.012),0,[0,.2,0],[.9,1.4,1]);
    if(p.gemstones!=='Freshwater pearls')part(p.gemstones==='None'?sphere(.16):new THREE.OctahedronGeometry(.18,0),p.gemstones==='None'?0:1,[0,-1.18,.02],[1,1.15,.3]);
    if(p.name.includes('Lariat'))part(new THREE.CylinderGeometry(.01,.01,.6,8),0,[0,-1.55,0]);
  }else if(p.category==='Earrings'){
    for(const x of [-.6,.6]){
      if(p.name.includes('Hoop')||p.name.includes('Huggie'))part(torus(.39,p.name.includes('Solstice')?.11:.045),0,[x,0,0],[1,1.15,1],[.08,.5,0]);
      else if(p.name.includes('Pearl')){part(sphere(.085),0,[x,.45,0]);part(sphere(.24),2,[x,-.1,0]);}
      else if(p.name.includes('Emerald')){part(new THREE.BoxGeometry(.32,.43,.06),0,[x,0,0]);part(new THREE.BoxGeometry(.27,.38,.075),1,[x,0,.035]);}
      else if(p.name.includes('Threader')){part(new THREE.CylinderGeometry(.009,.009,1.1,8),0,[x,.05,0]);part(new THREE.BoxGeometry(.045,.32,.035),0,[x,-.67,0]);}
      else for(let j=0;j<3;j++)part(sphere(.14+j*.035),0,[x,.5-j*.47,0],[1,1.5,.6]);
    }
  }else{
    if(p.name.includes('Pearl'))for(let j=0;j<24;j++){const a=j/24*Math.PI*2;part(sphere(.11),j%4===0?0:2,[Math.cos(a)*.9,Math.sin(a)*.9,0]);}
    else part(torus(.9,p.name.includes('Cuff')?.18:.055,p.name.includes('Cuff')?Math.PI*1.7:Math.PI*2),0,[0,0,0],[1,1,.65],[.45,0,0]);
    if(p.gemstones.includes('diamond')||p.gemstones.includes('Emerald'))for(let j=0;j<(p.gemstones.includes('Emerald')?3:32);j++){const a=j/(p.gemstones.includes('Emerald')?3:32)*Math.PI*2;part(new THREE.OctahedronGeometry(.075,0),1,[Math.cos(a)*.9,Math.sin(a)*.9,.035]);}
  }
  const chunks:Buffer[]=[],views:any[]=[],accessors:any[]=[],gltfMeshes:any[]=[],nodes:any[]=[];let offset=0;
  function append(array:Float32Array|Uint32Array,target:number,type:string,count:number,min?:number[],max?:number[]){const bytes=Buffer.from(array.buffer,array.byteOffset,array.byteLength);const view=views.length;views.push({buffer:0,byteOffset:offset,byteLength:bytes.length,target});chunks.push(bytes);offset+=bytes.length;const pad=(4-offset%4)%4;if(pad){chunks.push(Buffer.alloc(pad));offset+=pad;}const index=accessors.length;accessors.push({bufferView:view,componentType:array instanceof Uint32Array?5125:5126,count,type,...(min?{min,max}:{})});return index;}
  for(const m of meshes){
    const g=m.geometry.clone();g.applyMatrix4(m.matrixWorld);g.computeBoundingBox();const b=g.boundingBox!;
    const pos=append(new Float32Array(g.getAttribute('position').array),34962,'VEC3',g.getAttribute('position').count,b.min.toArray(),b.max.toArray());
    const normal=append(new Float32Array(g.getAttribute('normal').array),34962,'VEC3',g.getAttribute('normal').count);
    const indices=g.index?new Uint32Array(g.index.array):Uint32Array.from({length:g.getAttribute('position').count},(_,i)=>i);
    const index=append(indices,34963,'SCALAR',indices.length);
    nodes.push({mesh:gltfMeshes.length});gltfMeshes.push({primitives:[{attributes:{POSITION:pos,NORMAL:normal},indices:index,material:m.userData.material}]});
  }
  const gltf={asset:{version:'2.0',generator:'Lumiere illustrative design study'},scene:0,scenes:[{nodes:nodes.map((_,i)=>i)}],nodes,meshes:gltfMeshes,materials,buffers:[{byteLength:offset}],bufferViews:views,accessors};
  const json=Buffer.from(JSON.stringify(gltf)),jsonPad=(4-json.length%4)%4,jsonChunk=Buffer.concat([json,Buffer.alloc(jsonPad,32)]),binary=Buffer.concat(chunks);
  const header=Buffer.alloc(12);header.writeUInt32LE(0x46546c67);header.writeUInt32LE(2,4);header.writeUInt32LE(12+8+jsonChunk.length+8+binary.length,8);
  const jh=Buffer.alloc(8);jh.writeUInt32LE(jsonChunk.length);jh.writeUInt32LE(0x4e4f534a,4);const bh=Buffer.alloc(8);bh.writeUInt32LE(binary.length);bh.writeUInt32LE(0x004e4942,4);
  await writeFile(`public/models/${p.id}.glb`,Buffer.concat([header,jh,jsonChunk,bh,binary]));
}
console.log('24 illustrative GLB design models saved.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
