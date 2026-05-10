import { storyboardSchema } from '../schemas/storyboardSchema';
export function validateStoryboard(data:unknown){return storyboardSchema.parse(data);}
