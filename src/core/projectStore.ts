const store=new Map<string,any>(); export const projectStore={set:(id:string,v:any)=>store.set(id,v),get:(id:string)=>store.get(id)};
