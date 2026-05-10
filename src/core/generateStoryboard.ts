import OpenAI from 'openai';
import { loadFallbackStoryboard } from './loadFallbackStoryboard'; import { validateStoryboard } from './validateStoryboard';
export async function generateStoryboard(input:any,warnings:string[],opts?:{apiKey?:string,model?:string}){
 const key=opts?.apiKey||process.env.OPENAI_API_KEY; if(!key||input.use_openai===false){warnings.push('No OpenAI API key configured. Using fallback storyboard.'); return {storyboard:validateStoryboard(await loadFallbackStoryboard()), source:'fallback' as const};}
 try{const client=new OpenAI({apiKey:key}); const model=opts?.model||process.env.OPENAI_MODEL||'gpt-4.1-mini'; const r=await client.responses.create({model,input:`Return raw JSON only storyboard for: ${JSON.stringify(input)}`});
 const text=(r as any).output_text||''; if(text.includes('```')) throw new Error('markdown'); const parsed=JSON.parse(text); return {storyboard:validateStoryboard(parsed), source:'openai' as const};}catch{warnings.push('OpenAI fallback used'); return {storyboard:validateStoryboard(await loadFallbackStoryboard()), source:'fallback' as const};}
}
