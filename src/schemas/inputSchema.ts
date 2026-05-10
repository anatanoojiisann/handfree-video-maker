import { z } from 'zod';
export const inputSchema = z.object({topic:z.string().min(1),platform:z.string().min(1),aspect_ratio:z.enum(['16:9','9:16','1:1']),language:z.string().min(1),target_duration_sec:z.number().int().positive(),video_type:z.string().min(1),tone:z.string().optional(),use_openai:z.boolean().optional()});
