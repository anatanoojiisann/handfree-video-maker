import fs from 'node:fs/promises';
export async function loadFallbackStoryboard(){return JSON.parse(await fs.readFile('inputs/fallback_storyboard.json','utf-8'));}
