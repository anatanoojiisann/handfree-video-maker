import fs from 'node:fs/promises'; import path from 'node:path';
import { applyValidation, validateImageAsset } from './assetValidation';
import { generatePlaceholder } from './placeholderGenerator';
import { captureScreenshot } from './playwrightCapture';

async function writePlaceholder(asset:any,out:string,scene:any,storyboard:any,status:string,message:string){
 await generatePlaceholder(out,scene.on_screen_text,storyboard.aspect_ratio);
 asset.local_path=out;asset.status=status;asset.is_placeholder=true;asset.error_message=message;
 applyValidation(asset,await validateImageAsset(out,{isPlaceholder:true}));
}

export async function resolveAssets(projectDir:string,storyboard:any,assetList:any,warnings:string[]){const assetsDir=path.join(projectDir,'assets');await fs.mkdir(assetsDir,{recursive:true});
 for(const a of assetList.assets){const scene=storyboard.scenes.find((s:any)=>s.scene_id===a.scene_id);const out=path.join(assetsDir,`${a.scene_id}.png`);
 a.local_path=null;a.asset_url=null;a.is_placeholder=false;a.validation_status='invalid';a.validation_errors=[];a.file_size_bytes=null;a.width=null;a.height=null;a.error_message=null;
 if(!scene){a.status='asset_failed';a.error_message='Scene not found for asset.';warnings.push(`${a.scene_id}: Scene not found for asset.`);continue;}
 a.asset_source=scene.preferred_asset_source;
 if(scene.preferred_asset_source==='playwright_screenshot'){
  const url=scene.capture_url;
  if(!url){await writePlaceholder(a,out,scene,storyboard,'asset_missing_config','Missing source URL for Playwright screenshot.');warnings.push(`${a.scene_id}: Missing source URL for Playwright screenshot; placeholder asset generated.`);continue;}
  try{await captureScreenshot(url,out,storyboard.aspect_ratio);a.local_path=out;a.is_placeholder=false;applyValidation(a,await validateImageAsset(out));if(a.validation_status==='valid'){a.status='asset_captured';warnings.push(`${a.scene_id}: Playwright screenshot captured and validated.`);}else{a.status='asset_validation_failed';a.error_message=a.validation_errors.join('; ');warnings.push(`${a.scene_id}: Screenshot validation failed: ${a.error_message}`);await writePlaceholder(a,out,scene,storyboard,'placeholder_generated',`Screenshot validation failed: ${a.error_message}`);}}
  catch(e:any){await writePlaceholder(a,out,scene,storyboard,'asset_failed',`Playwright screenshot failed: ${e.message}`);warnings.push(`${a.scene_id}: Playwright screenshot failed; placeholder asset generated.`);}
  continue;
 }
 if(scene.preferred_asset_source==='ai_generated'){
  await writePlaceholder(a,out,scene,storyboard,'asset_missing_config','AI image generation is not implemented/configured in this MVP.');
  warnings.push(`${a.scene_id}: AI image generation missing config/implementation; placeholder asset generated.`);
  continue;
 }
 if(scene.preferred_asset_source==='manual_upload'||scene.preferred_asset_source==='existing_asset'){
  await writePlaceholder(a,out,scene,storyboard,'asset_missing_config','Real asset lookup/upload is not available yet; placeholder asset generated.');
  warnings.push(`${a.scene_id}: Real asset lookup/upload unavailable; placeholder asset generated.`);
  continue;
 }
 try{await writePlaceholder(a,out,scene,storyboard,'placeholder_generated','No real asset source configured; placeholder asset generated.');warnings.push(`${a.scene_id}: Placeholder asset generated.`);}
 catch(e:any){a.status='asset_failed';a.local_path=null;a.is_placeholder=false;a.error_message=`Placeholder failed: ${e.message}`;applyValidation(a,await validateImageAsset(null));warnings.push(`${a.scene_id}: Placeholder failed.`)}
 }
 return assetList;}
