import { execSync } from 'node:child_process';
export function dims(ar:string){return ar==='9:16'?'1080x1920':ar==='1:1'?'1080x1080':'1920x1080';}
export function generatePlaceholder(path:string,text:string,ar:string){const d=dims(ar);execSync(`ffmpeg -y -f lavfi -i color=c=0x1e1e1e:s=${d}:d=1 -vf \"drawtext=fontcolor=white:fontsize=48:text='${text.replace(/'/g,'')}' :x=(w-text_w)/2:y=(h-text_h)/2\" -frames:v 1 ${path}`);}
