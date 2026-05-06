import { describe,it,expect } from 'vitest';
import fs from 'node:fs';import fsp from 'node:fs/promises';import path from 'node:path';
import { resolveAssets } from '../src/core/assetResolver';
import { buildAssetList } from '../src/core/buildAssetList';
const sb={project_title:'BTC 80K Breakout or Trap',language:'en',platform:'youtube',aspect_ratio:'16:9',target_duration_sec:45,scenes:[1,2,3,4,5].map(i=>({scene_id:`scene_00${i}`,purpose:'x',estimated_duration_sec:5,voiceover:'v',on_screen_text:`text ${i}`,visual_type:'text_card',preferred_asset_source:'none',asset_prompt:'',capture_url:null,notes:''})),title_description_hashtags:{title:'t',description:'d',hashtags:['#a']}};
describe('asset resolver none=>generated',()=>{it('creates png assets',async()=>{const dir='outputs/test-assets';await fsp.rm(dir,{recursive:true,force:true});const list=buildAssetList('test-assets',sb);const warnings:string[]=[];await resolveAssets(dir,sb,list,warnings);for(const a of list.assets){expect(a.status).toBe('generated');expect(a.local_path).toBeTruthy();expect(fs.existsSync(a.local_path)).toBe(true);}expect(fs.readdirSync(path.join(dir,'assets')).length).toBeGreaterThan(0);});});
