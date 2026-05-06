import { useMemo, useState } from 'react';

type Status = 'Idle'|'Loading'|'Success'|'Error';
const defaults={topic:'BTC returns to 80K: real breakout or leverage trap?',platform:'youtube',aspect_ratio:'16:9',language:'en',target_duration_sec:120,video_type:'crypto_analysis',tone:'sharp, analytical, retention-focused'};

export default function App(){
 const [form,setForm]=useState(defaults); const [pasted,setPasted]=useState(''); const [status,setStatus]=useState<Status>('Idle'); const [error,setError]=useState(''); const [project,setProject]=useState<any>(null);
 const canRender=useMemo(()=>project?.asset_list?.assets?.every((a:any)=>['approved','generated','captured','uploaded','replaced'].includes(a.status)),[project]);
 const api=async(url:string,init?:RequestInit)=>{setStatus('Loading');setError('');const r=await fetch(`http://localhost:3001${url}`,init);const j=await r.json();if(!r.ok) throw new Error(j.error||'Request failed');setProject(j);setStatus('Success');};
 const doGenerate=()=>api('/api/storyboard/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)}).catch(e=>{setError(e.message);setStatus('Error')});
 const usePasted=()=>{try{JSON.parse(pasted);}catch{setError('Invalid JSON in pasted storyboard');setStatus('Error');return;} api('/api/storyboard/use-pasted',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({storyboard:JSON.parse(pasted)})}).catch(e=>{setError(e.message);setStatus('Error')});};
 const sceneAction=(url:string,scene_id:string)=>api(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({project_id:project.project_id,scene_id})}).catch(e=>{setError(e.message);setStatus('Error')});
 const upload=async(scene_id:string,f?:File)=>{if(!f)return;const fd=new FormData();fd.append('project_id',project.project_id);fd.append('scene_id',scene_id);fd.append('file',f);try{await api('/api/assets/upload',{method:'POST',body:fd});}catch(e:any){setError(e.message);setStatus('Error')}};
 return <div className='page'><h1>CapCut Handoff MVP</h1>
 <section><h2>Input Panel</h2>{Object.entries(form).map(([k,v])=><label key={k}>{k}<input value={String(v)} onChange={e=>setForm({...form,[k]:k==='target_duration_sec'?Number(e.target.value):e.target.value})}/></label>)}<button onClick={doGenerate}>Generate Storyboard</button>
 <textarea placeholder='Paste storyboard JSON' value={pasted} onChange={e=>setPasted(e.target.value)} rows={8}/><button onClick={usePasted}>Use Pasted Storyboard</button></section>
 <section><h2>Status</h2><div>{status}</div>{error&&<pre className='err'>{error}</pre>}</section>
 {project&&<>
 <section><h2>Storyboard Timeline</h2>{project.storyboard.scenes.map((s:any)=>{const a=project.asset_list.assets.find((x:any)=>x.scene_id===s.scene_id); return <article key={s.scene_id} className='card'><h3>{s.scene_id} - {s.purpose}</h3><p>Duration: {s.estimated_duration_sec}s | Visual: {s.visual_type} | Source: {s.preferred_asset_source}</p><p><b>Voiceover:</b> {s.voiceover}</p><p><b>On-screen:</b> {s.on_screen_text}</p><p><b>Status:</b> {a?.status}</p>{a?.local_path && <img src={`http://localhost:3001/${String(a.local_path).replace(/^outputs\//,'outputs/')}`} alt={s.scene_id} />}<div><button onClick={()=>sceneAction('/api/assets/approve',s.scene_id)}>Approve Asset</button><button onClick={()=>sceneAction('/api/assets/reject',s.scene_id)}>Reject Asset</button><button onClick={()=>sceneAction('/api/assets/refetch',s.scene_id)}>Re-fetch Asset</button><input type='file' onChange={e=>upload(s.scene_id,e.target.files?.[0])}/></div></article>;})}</section>
 <section><h2>Render Panel</h2><button disabled={!canRender} onClick={()=>api('/api/render',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({project_id:project.project_id})}).catch(e=>{setError(e.message);setStatus('Error')})}>Generate Rough Cut</button></section>
 <section><h2>Output Paths</h2><pre>{JSON.stringify(project.output_paths||{},null,2)}</pre></section>
 </>}
 </div>;
}
