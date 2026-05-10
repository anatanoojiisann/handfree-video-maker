import { storyboardSchema } from '../schemas/storyboardSchema';

const visualTypeAliases: Record<string, string> = {
  market_chart: 'chart',
  checklist: 'text_card',
  liquidation_visual: 'ai_generated',
  analysis_card: 'text_card',
  placeholder_test: 'text_card',
  product_transition: 'b_roll'
};

const assetSourceAliases: Record<string, string> = {
  ai_generated_image: 'ai_generated',
  existing_asset_library: 'existing_asset'
};

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function issueMessage(issue: { path: (string | number)[]; message: string }) {
  const path = issue.path.join('.');
  if (path.match(/^scenes\.\d+\.estimated_duration_sec$/)) {
    const index = Number(issue.path[1]) + 1;
    return `Scene ${index} is missing estimated_duration_sec. You may also provide duration_sec as an alias.`;
  }
  return path ? `${path}: ${issue.message}` : issue.message;
}

export function normalizeStoryboardInput(input: unknown) {
  const storyboard = cloneJson(input);
  if (!storyboard || typeof storyboard !== 'object') return storyboard;

  const data = storyboard as any;
  if (!data.title_description_hashtags) {
    data.title_description_hashtags = {
      title: data.project_title || 'Untitled video',
      description: data.market_context || '',
      hashtags: []
    };
  }

  if (Array.isArray(data.scenes)) {
    data.scenes = data.scenes.map((scene: any) => {
      const next = { ...scene };
      if (next.estimated_duration_sec === undefined && next.duration_sec !== undefined) {
        next.estimated_duration_sec = next.duration_sec;
      }
      if (typeof next.visual_type === 'string' && visualTypeAliases[next.visual_type]) {
        next.visual_type = visualTypeAliases[next.visual_type];
      }
      if (typeof next.preferred_asset_source === 'string' && assetSourceAliases[next.preferred_asset_source]) {
        next.preferred_asset_source = assetSourceAliases[next.preferred_asset_source];
      }
      if (next.asset_prompt === undefined) {
        next.asset_prompt = next.image_prompt || (Array.isArray(next.asset_keywords) ? next.asset_keywords.join(', ') : '');
      }
      if (next.capture_url === undefined) next.capture_url = next.source_url || null;
      if (next.notes === undefined) next.notes = next.motion_instruction || '';
      return next;
    });
  }

  return data;
}

export function validatePastedStoryboard(input: unknown) {
  const normalized = normalizeStoryboardInput(input);
  const parsed = storyboardSchema.safeParse(normalized);
  if (!parsed.success) {
    return { ok: false as const, errors: parsed.error.issues.map(issueMessage) };
  }
  return { ok: true as const, storyboard: parsed.data };
}
