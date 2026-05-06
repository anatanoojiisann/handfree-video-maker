import fs from 'node:fs/promises'; import path from 'node:path';
import { generatePlaceholder } from './placeholderGenerator';
export async function resolveAssets(projectDir:string,storyboard:any,assetList:any,warnings:string[]){const assetsDir=path.join(projectDir,'assets');await fs.mkdir(assetsDir,{recursive:true});
 for(const a of assetList.assets){const scene=storyboard.scenes.find((s:any)=>s.scene_id===a.scene_id);const out=path.join(assetsDir,`${a.scene_id}.png`);
 if(scene.preferred_asset_source==='manual_upload'||scene.preferred_asset_source==='existing_asset'){a.status='pending';warnings.push('Manual upload required');continue;}
 try{await generatePlaceholder(out,scene.on_screen_text,storyboard.aspect_ratio);a.local_path=out;a.status=scene.preferred_asset_source==='playwright_screenshot'?'captured':'generated';warnings.push('Placeholder generated');}
 catch{a.status='missing';a.local_path=null;warnings.push(`Placeholder failed for ${a.scene_id}`)}
 }
 return assetList;}
