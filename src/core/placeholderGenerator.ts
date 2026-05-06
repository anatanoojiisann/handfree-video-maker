import fs from 'node:fs/promises';
import sharp from 'sharp';

export function dims(ar:string){return ar==='9:16'?{w:1080,h:1920}:ar==='1:1'?{w:1080,h:1080}:{w:1920,h:1080};}
const esc=(s:string)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
export async function generatePlaceholder(path:string,text:string,ar:string){const {w,h}=dims(ar); const svg=`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'><rect width='100%' height='100%' fill='#1f2937'/><foreignObject x='80' y='80' width='${w-160}' height='${h-160}'><div xmlns='http://www.w3.org/1999/xhtml' style='color:white;font-size:52px;font-family:Arial, sans-serif;line-height:1.3;'>${esc(text)}</div></foreignObject></svg>`; await fs.mkdir(path.split('/').slice(0,-1).join('/'),{recursive:true}); await sharp(Buffer.from(svg)).png().toFile(path);}
