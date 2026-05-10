import { execSync } from 'node:child_process';import fs from 'node:fs/promises';import path from 'node:path';
export async function compose(projectDir:string,storyboard:any,assetList:any){try{execSync('ffmpeg -version',{stdio:'ignore'});}catch{throw new Error('ffmpeg is missing. Install ffmpeg and ensure it is in PATH.');}
 const list:string[]=[]; for(const s of storyboard.scenes){const a=assetList.assets.find((x:any)=>x.scene_id===s.scene_id);const clip=path.join(projectDir,`${s.scene_id}.mp4`);execSync(`ffmpeg -y -loop 1 -t ${s.estimated_duration_sec} -i ${a.local_path} -f lavfi -t ${s.estimated_duration_sec} -i anullsrc=r=48000:cl=stereo -shortest -c:v libx264 -c:a aac ${clip}`);list.push(`file '${clip}'`);} const txt=path.join(projectDir,'concat.txt'); await fs.writeFile(txt,list.join('\n'));
 execSync(`ffmpeg -y -f concat -safe 0 -i ${txt} -c:v libx264 -c:a aac ${path.join(projectDir,'rough_cut.mp4')}`);
}
