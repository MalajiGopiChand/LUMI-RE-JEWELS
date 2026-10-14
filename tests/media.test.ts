import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {storePosts} from '../lib/instagram';
import {carlaPhotos} from '../lib/carla-media';
test('every supplied reel has a playable fast-start MP4 and poster',()=>{
 const reels=storePosts.filter(p=>p.kind==='reel');assert.equal(reels.length,15);
 for(const post of reels){const file=readFileSync(`public/videos/carla/${post.id}.mp4`);assert.equal(file.toString('ascii',4,8),'ftyp',post.id);let offset=0;const atoms:string[]=[];while(offset+8<=file.length){const size=file.readUInt32BE(offset);if(size<8)break;atoms.push(file.toString('ascii',offset+4,offset+8));offset+=size;}assert.ok(atoms.indexOf('moov')>=0&&atoms.indexOf('moov')<atoms.indexOf('mdat'),post.id);assert.ok(existsSync(`public/videos/carla/${post.id}.jpg`),post.id);}
});
test('original photo manifest resolves all 18 local photographs',()=>{assert.equal(carlaPhotos.length,18);assert.equal(new Set(carlaPhotos.map(p=>p.src)).size,18);for(const photo of carlaPhotos)assert.ok(existsSync('public'+photo.src),photo.src)});
