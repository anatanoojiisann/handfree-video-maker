import 'dotenv/config'; import OpenAI from 'openai';
import { loadFallbackStoryboard } from './loadFallbackStoryboard'; import { validateStoryboard } from './validateStoryboard';
export async function generateStoryboard(input:any,warnings:string[]){
 const key=process.env.OPENAI_API_KEY; if(!key||input.use_openai===false){console.log('Using local fallback storyboard');warnings.push('OpenAI fallback used');return validateStoryboard(await loadFallbackStoryboard());}
 try{const client=new OpenAI({apiKey:key}); const model=process.env.OPENAI_MODEL||'gpt-4.1-mini'; const r=await client.responses.create({model,input:`Return raw JSON only storyboard for: ${JSON.stringify(input)}`});
 const text=(r as any).output_text||''; if(text.includes('```')) throw new Error('markdown'); const parsed=JSON.parse(text); return validateStoryboard(parsed);}catch{console.log('Using local fallback storyboard');warnings.push('OpenAI fallback used');return validateStoryboard(await loadFallbackStoryboard());}
}
