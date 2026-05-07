import { useEffect, useState } from 'react';
import { validatePastedStoryboard } from '../core/normalizeStoryboard';
import { warningKey } from './uiKeys';

const defaults = {
  topic: 'BTC returns to 80K: real breakout or leverage trap?',
  platform: 'youtube',
  aspect_ratio: '16:9',
  language: 'en',
  target_duration_sec: 120,
  video_type: 'crypto_analysis',
  tone: 'sharp, analytical, retention-focused'
};

const samplePastedStoryboard = JSON.stringify({
  project_title: 'BTC 80K Breakout or Leverage Trap',
  language: 'en',
  platform: 'youtube',
  aspect_ratio: '16:9',
  target_duration_sec: 120,
  scenes: [
    {
      scene_id: 'scene_001',
      purpose: 'hook',
      estimated_duration_sec: 8,
      voiceover: 'Bitcoin is back near eighty thousand dollars but the real question is whether this is a breakout or just another leverage trap',
      on_screen_text: 'BTC $80K: Breakout or Trap?',
      visual_type: 'chart',
      preferred_asset_source: 'playwright_screenshot',
      asset_prompt: 'bitcoin, btc chart, market breakout',
      capture_url: null,
      notes: 'Fast zoom into a Bitcoin chart with a warning flash'
    },
    {
      scene_id: 'scene_002',
      purpose: 'conflict',
      estimated_duration_sec: 12,
      voiceover: 'When price moves fast traders often confuse momentum with real demand but leverage can make a move look stronger than it really is',
      on_screen_text: 'Momentum is not real demand',
      visual_type: 'text_card',
      preferred_asset_source: 'ai_generated',
      asset_prompt: 'leverage, market risk, crypto trading',
      capture_url: null,
      notes: 'Show a clean text card with market alert elements'
    }
  ],
  title_description_hashtags: {
    title: 'BTC $80K: Breakout or Trap?',
    description: 'Bitcoin is back near $80K, but the move may be driven by leverage instead of real demand.',
    hashtags: ['#Bitcoin', '#BTC', '#Crypto']
  }
}, null, 2);

const pastedSchemaText = `Required pasted storyboard shape:
{
  "project_title": "string",
  "language": "string",
  "platform": "string",
  "aspect_ratio": "16:9" | "9:16" | "1:1",
  "target_duration_sec": number,
  "scenes": [
    {
      "scene_id": "string",
      "purpose": "string",
      "estimated_duration_sec": number,
      "voiceover": "string",
      "on_screen_text": "string",
      "visual_type": "title_card" | "chart" | "website_capture" | "screen_recording" | "uploaded_asset" | "ai_generated" | "text_card" | "comparison_card" | "poll_card" | "b_roll",
      "preferred_asset_source": "playwright_screenshot" | "playwright_recording" | "manual_upload" | "ai_generated" | "existing_asset" | "none",
      "asset_prompt": "string",
      "capture_url": string | null,
      "notes": "string"
    }
  ],
  "title_description_hashtags": {
    "title": "string",
    "description": "string",
    "hashtags": ["#tag"]
  }
}

Accepted aliases before submit: duration_sec becomes estimated_duration_sec, ai_generated_image becomes ai_generated, existing_asset_library becomes existing_asset.`;

export default function App() {
  const [form, setForm] = useState(defaults);
  const [pasted, setPasted] = useState(samplePastedStoryboard);
  const [status, setStatus] = useState('Idle');
  const [msg, setMsg] = useState('');
  const [project, setProject] = useState<any>();
  const [settings, setSettings] = useState<any>({ openai_model: 'gpt-4.1-mini' });
  const [apiKey, setApiKey] = useState('');

  const req = async (url: string, init?: RequestInit) => {
    setStatus('Loading');
    setMsg('');
    const r = await fetch(`http://localhost:3001${url}`, init);
    const j = await r.json();
    if (!j.ok) throw new Error(j.error);
    setStatus('Success');
    setProject(j.data.project_id ? j.data : project);
    return j.data;
  };

  const loadSettings = () => req('/api/settings').then(d => setSettings(d)).catch(e => {
    setStatus('Error');
    setMsg(e.message);
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const sourceLabel = (s: string) => s === 'openai' ? 'OpenAI' : s === 'fallback' ? 'Fallback' : 'Pasted JSON';
  const assetKind = (a: any) => !a ? 'No asset' : a.is_placeholder ? 'Placeholder asset' : 'Real asset';

  const gen = () => req('/api/storyboard/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(form)
  }).catch(e => {
    setStatus('Error');
    setMsg(e.message);
  });

  const useP = async () => {
    setMsg('');
    if (!pasted.trim()) {
      setStatus('Error');
      setMsg('Pasted storyboard JSON is empty.');
      return;
    }

    try {
      const obj = JSON.parse(pasted);
      const validated = validatePastedStoryboard(obj);
      if (!validated.ok) throw new Error(validated.errors.join('\n'));
      setPasted(JSON.stringify(validated.storyboard, null, 2));
      await req('/api/storyboard/use-pasted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyboard: validated.storyboard })
      });
    } catch (e: any) {
      setStatus('Error');
      setMsg(e.message || 'Invalid pasted storyboard JSON.');
    }
  };

  const action = (u: string, sid: string) => req(u, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project_id: project.project_id, scene_id: sid })
  }).then(setProject).catch(e => {
    setStatus('Error');
    setMsg(e.message);
  });

  return <div className='page'><h1>CapCut Handoff MVP</h1>
    <section><h2>API Settings</h2><p>Configured: {settings.masked_openai_api_key || 'No key configured'}</p><input placeholder='OpenAI API Key' value={apiKey} onChange={e => setApiKey(e.target.value)} /><input value={settings.openai_model || 'gpt-4.1-mini'} onChange={e => setSettings({ ...settings, openai_model: e.target.value })} /><button onClick={() => req('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ openai_api_key: apiKey, openai_model: settings.openai_model }) }).then(loadSettings).catch(e => { setStatus('Error'); setMsg(e.message); })}>Save API Settings</button><button onClick={() => req('/api/settings/test-openai', { method: 'POST' }).then(() => setMsg('OpenAI test successful')).catch(e => { setStatus('Error'); setMsg(e.message); })}>Test API Connection</button><button onClick={() => req('/api/settings/clear-openai-key', { method: 'POST' }).then(loadSettings).catch(e => { setStatus('Error'); setMsg(e.message); })}>Clear API Key</button></section>
    <section><h2>Input Panel</h2>{Object.entries(form).map(([k, v]) => <label key={k}>{k}<input value={String(v)} onChange={e => setForm({ ...form, [k]: k === 'target_duration_sec' ? Number(e.target.value) : e.target.value })} /></label>)}<button onClick={gen}>Generate Storyboard</button><pre className='schema'>{pastedSchemaText}</pre><textarea rows={18} value={pasted} onChange={e => setPasted(e.target.value)} /><button onClick={useP}>Use Pasted Storyboard</button></section>
    <section><h2>Status / Warnings</h2><div>{status}</div>{msg && <div className='err'>{msg}</div>}{project?.warnings?.map((w: string, i: number) => <div className='warn' key={warningKey(project.project_id,w,i)}>{w}</div>)}{project && <div>Storyboard Source: {sourceLabel(project.storyboard_source)}</div>}</section>
    {project && <section><h2>Storyboard Timeline</h2>{project.storyboard.scenes.map((s: any) => { const a = project.asset_list.assets.find((x: any) => x.scene_id === s.scene_id); return <article className='card' key={s.scene_id}><h3>{s.scene_id}</h3><p>{s.purpose} | {s.estimated_duration_sec}s | {s.visual_type}</p><p>{s.voiceover}</p><p>{s.on_screen_text}</p><div className='assetMeta'><strong>{assetKind(a)}</strong><span>Status: {a?.status || 'missing'}</span><span>Asset source: {a?.asset_source || 'unknown'}</span><span>Validation: {a?.validation_status || 'not checked'}</span><span>File size: {a?.file_size_bytes ? `${a.file_size_bytes} bytes` : 'n/a'}</span><span>Dimensions: {a?.width && a?.height ? `${a.width} x ${a.height}` : 'n/a'}</span>{a?.asset_url && <span>Asset URL: <a href={a.asset_url} target='_blank' rel='noreferrer'>{a.asset_url}</a></span>}{a?.error_message && <span className='err'>{a.error_message}</span>}{a?.validation_errors?.map((er: string, i: number) => <span className='err' key={`${a.scene_id}-validation-${i}`}>{er}</span>)}</div>{a?.asset_url && <figure className={a.is_placeholder ? 'placeholderPreview' : 'realPreview'}><img src={a.asset_url} alt={`${s.scene_id} ${a.is_placeholder ? 'placeholder asset' : 'real asset'} preview`} /><figcaption>{a.is_placeholder ? 'Placeholder asset' : 'Validated real asset'}</figcaption></figure>}<button onClick={() => action('/api/assets/approve', s.scene_id)}>Approve Asset</button><button onClick={() => action('/api/assets/reject', s.scene_id)}>Reject Asset</button><button onClick={() => action('/api/assets/refetch', s.scene_id)}>Re-fetch Asset</button><input type='file' onChange={async e => { try { const f = e.target.files?.[0]; if (!f) return; const fd = new FormData(); fd.append('project_id', project.project_id); fd.append('scene_id', s.scene_id); fd.append('file', f); const r = await fetch('http://localhost:3001/api/assets/upload', { method: 'POST', body: fd }); const j = await r.json(); if (!j.ok) throw new Error(j.error); setProject(j.data); } catch (err: any) { setStatus('Error'); setMsg(err.message); } }} /></article>; })}</section>}
    {project && <section><h2>Render Panel</h2><button onClick={() => req('/api/render', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ project_id: project.project_id }) }).then(d => setProject(d)).catch(e => { setStatus('Error'); setMsg(e.message); })}>Generate Rough Cut</button></section>}
    {project && <section><h2>Output Paths</h2><pre>{JSON.stringify(project.output_paths, null, 2)}</pre></section>}</div>;
}
