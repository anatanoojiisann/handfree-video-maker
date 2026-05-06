import { useState } from 'react';
export default function App(){const [data,setData]=useState<any>(null);const [topic,setTopic]=useState('BTC returns to 80K');
 const gen=async()=>{const r=await fetch('http://localhost:3001/api/storyboard/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({topic,platform:'youtube',aspect_ratio:'16:9',language:'en',target_duration_sec:120,video_type:'crypto_analysis'})});setData(await r.json())};
 return <div><h1>CapCut Handoff MVP</h1><input value={topic} onChange={e=>setTopic(e.target.value)}/><button onClick={gen}>Generate Storyboard</button>{data&&<pre>{JSON.stringify(data,null,2)}</pre>}</div>}
