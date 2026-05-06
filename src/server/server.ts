import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'node:fs/promises';
import path from 'node:path';
import { inputSchema } from '../schemas/inputSchema';
import { storyboardSchema } from '../schemas/storyboardSchema';
import { generateStoryboard } from '../core/generateStoryboard';
import { buildAssetList } from '../core/buildAssetList';
import { resolveAssets } from '../core/assetResolver';
import { compose } from '../core/mediaComposer';
import { buildManifest } from '../core/manifestBuilder';
import { writeJson } from '../core/outputWriter';

const app = express(); app.use(cors()); app.use(express.json({limit:'5mb'})); app.use('/outputs', express.static('outputs'));
const upload = multer({ dest: 'public/uploads' });
const store = new Map<string, any>();
const mkId = (s:string)=>`${s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,36)}-${Date.now()}`;

async function bootstrapProject(project_id:string, storyboard:any){
 const dir=path.join('outputs',project_id); await fs.mkdir(path.join(dir,'assets'),{recursive:true});
 await writeJson(path.join(dir,'storyboard.json'),storyboard);
 const warnings:string[]=[]; let asset_list=buildAssetList(project_id, storyboard); asset_list=await resolveAssets(dir, storyboard, asset_list, warnings); await writeJson(path.join(dir,'asset_list.json'),asset_list);
 const manifest=buildManifest(project_id, storyboard, asset_list, warnings); await writeJson(path.join(dir,'edit_manifest.json'),manifest);
 const state={project_id, storyboard, asset_list, manifest, warnings, output_paths:{storyboard_json:path.join(dir,'storyboard.json'),asset_list_json:path.join(dir,'asset_list.json'),edit_manifest_json:path.join(dir,'edit_manifest.json')}};
 store.set(project_id,state); return state;
}

app.post('/api/storyboard/generate', async (req,res)=>{try{const input=inputSchema.parse(req.body); const sb=await generateStoryboard(input,[]); const state=await bootstrapProject(mkId(input.topic),sb); res.json(state);}catch(e:any){res.status(400).json({error:e.message});}});
app.post('/api/storyboard/use-pasted', async (req,res)=>{try{const sb=storyboardSchema.parse(req.body.storyboard); const state=await bootstrapProject(mkId(sb.project_title),sb); res.json(state);}catch(e:any){res.status(400).json({error:e.message});}});
app.post('/api/assets/resolve', async (req,res)=>{try{const st=store.get(req.body.project_id); if(!st) return res.status(404).json({error:'Project not found'}); st.asset_list=await resolveAssets(path.join('outputs',st.project_id), st.storyboard, st.asset_list, st.warnings); await writeJson(path.join('outputs',st.project_id,'asset_list.json'),st.asset_list); res.json(st);}catch(e:any){res.status(400).json({error:e.message});}});
app.post('/api/assets/refetch', async (req,res)=>{try{const st=store.get(req.body.project_id); if(!st) return res.status(404).json({error:'Project not found'}); const target=st.asset_list.assets.filter((a:any)=>a.scene_id===req.body.scene_id); st.asset_list.assets=st.asset_list.assets.filter((a:any)=>a.scene_id!==req.body.scene_id); const partial={project_id:st.project_id,assets:target}; await resolveAssets(path.join('outputs',st.project_id), st.storyboard, partial, st.warnings); st.asset_list.assets.push(...partial.assets); await writeJson(path.join('outputs',st.project_id,'asset_list.json'),st.asset_list); res.json(st);}catch(e:any){res.status(400).json({error:e.message});}});
app.post('/api/assets/upload', upload.single('file'), async (req,res)=>{try{const {project_id,scene_id}=req.body; const st=store.get(project_id); if(!st||!req.file)return res.status(400).json({error:'Missing data'}); const ext=path.extname(req.file.originalname)||'.png'; const out=path.join('outputs',project_id,'assets',`${scene_id}${ext}`); await fs.rename(req.file.path,out); const a=st.asset_list.assets.find((x:any)=>x.scene_id===scene_id); a.local_path=out; a.status='replaced'; await writeJson(path.join('outputs',st.project_id,'asset_list.json'),st.asset_list); res.json(st);}catch(e:any){res.status(400).json({error:e.message});}});
for (const action of ['approve','reject']) app.post(`/api/assets/${action}`,(req,res)=>{const st=store.get(req.body.project_id); if(!st) return res.status(404).json({error:'Project not found'}); const a=st.asset_list.assets.find((x:any)=>x.scene_id===req.body.scene_id); a.status=action==='approve'?'approved':'rejected'; res.json(st);});
app.post('/api/render', async (req,res)=>{try{const st=store.get(req.body.project_id); if(!st) return res.status(404).json({error:'Project not found'}); const dir=path.join('outputs',st.project_id); await compose(dir,st.storyboard,st.asset_list); const tdh=st.storyboard.title_description_hashtags; await fs.writeFile(path.join(dir,'title_description_hashtags.txt'),`TITLE:\n${tdh.title}\n\nDESCRIPTION:\n${tdh.description}\n\nHASHTAGS:\n${tdh.hashtags.join(' ')}`); let c=0; const lines=st.storyboard.scenes.map((s:any)=>{const start=c; c+=s.estimated_duration_sec; const line=`[${s.scene_id} | 0:${String(start).padStart(2,'0')} - 0:${String(c).padStart(2,'0')}]\n${s.voiceover}`; return line;}); await fs.writeFile(path.join(dir,'capcut_voiceover_script.txt'),lines.join('\n\n')); st.manifest=buildManifest(st.project_id,st.storyboard,st.asset_list,st.warnings); await writeJson(path.join(dir,'edit_manifest.json'),st.manifest); st.output_paths={rough_cut:path.join(dir,'rough_cut.mp4'),storyboard_json:path.join(dir,'storyboard.json'),asset_list_json:path.join(dir,'asset_list.json'),edit_manifest_json:path.join(dir,'edit_manifest.json'),capcut_voiceover_script:path.join(dir,'capcut_voiceover_script.txt'),title_description_hashtags:path.join(dir,'title_description_hashtags.txt')}; res.json(st);}catch(e:any){res.status(400).json({error:e.message});}});
app.get('/api/project/:projectId',(req,res)=>{const st=store.get(req.params.projectId); if(!st) return res.status(404).json({error:'Project not found'}); res.json(st);});

app.listen(Number(process.env.PORT||3001),()=>console.log('server on 3001'));
