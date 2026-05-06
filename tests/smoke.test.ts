import { describe,it,expect } from 'vitest';
import { storyboardSchema } from '../src/schemas/storyboardSchema';
import fs from 'node:fs';
import { buildAssetList } from '../src/core/buildAssetList';
import { generatePlaceholder } from '../src/core/placeholderGenerator';
const sb=JSON.parse(fs.readFileSync('inputs/fallback_storyboard.json','utf8'));
describe('schema',()=>{it('valid passes',()=>expect(()=>storyboardSchema.parse(sb)).not.toThrow());it('missing scenes fails',()=>{const x={...sb}; delete x.scenes; expect(()=>storyboardSchema.parse(x)).toThrow();});});
describe('asset list',()=>{it('generated',()=>{const a=buildAssetList('p1',sb); expect(a.assets.length).toBe(sb.scenes.length);});});
describe('placeholder',()=>{it('creates png',async()=>{await generatePlaceholder('outputs/test-placeholder.png','BTC $80K: Breakout or Trap?','16:9'); expect(fs.existsSync('outputs/test-placeholder.png')).toBe(true);});});
