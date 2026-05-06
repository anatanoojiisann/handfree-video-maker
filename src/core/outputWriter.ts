import fs from 'node:fs/promises';
export async function writeJson(path:string,data:any){await fs.writeFile(path,JSON.stringify(data,null,2));}
