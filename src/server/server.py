import json, os, shutil, subprocess
from pathlib import Path
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=['*'], allow_methods=['*'], allow_headers=['*'])
STORE = {}

class GenerateReq(BaseModel):
    topic:str; platform:str; aspect_ratio:str; language:str; target_duration_sec:int; video_type:str; tone:str|None=None

@app.post('/api/storyboard/generate')
def generate(req:GenerateReq):
    sb=json.loads(Path('inputs/fallback_storyboard.json').read_text())
    pid=f"{req.topic.lower().replace(' ','-')[:24]}-20260506"
    assets=[{"scene_id":s['scene_id'],"status":"generated"} for s in sb['scenes']]
    STORE[pid]={"project_id":pid,"storyboard":sb,"asset_list":{"project_id":pid,"assets":assets}}
    return STORE[pid]

@app.post('/api/storyboard/use-pasted')
def pasted(payload:dict):
    pid='pasted-20260506'; STORE[pid]={"project_id":pid,"storyboard":payload,"asset_list":{"project_id":pid,"assets":[]}}; return STORE[pid]

@app.post('/api/assets/resolve')
def resolve(payload:dict): return {"ok":True}
@app.post('/api/assets/refetch')
def refetch(payload:dict): return {"ok":True}
@app.post('/api/assets/approve')
def approve(payload:dict): return {"ok":True}
@app.post('/api/assets/reject')
def reject(payload:dict): return {"ok":True}

@app.post('/api/assets/upload')
async def upload(project_id:str, scene_id:str, file:UploadFile=File(...)):
    out=Path('public/uploads')/f"{project_id}-{scene_id}-{file.filename}"; out.write_bytes(await file.read()); return {"path":str(out)}

@app.post('/api/render')
def render(payload:dict): return {"ok":True,"output_paths":{}}
@app.get('/api/project/{project_id}')
def project(project_id:str): return STORE.get(project_id,{})

if __name__=='__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=int(os.getenv('PORT','3001')))
