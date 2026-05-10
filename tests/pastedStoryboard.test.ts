import { describe, expect, it } from 'vitest';
import { validatePastedStoryboard } from '../src/core/normalizeStoryboard';

const pastedStoryboard = {
  project_title: 'BTC 80K Breakout or Leverage Trap',
  market_context: 'Bitcoin has returned near the 80000 dollar level while traders debate whether this is real demand or another leverage driven trap.',
  platform: 'youtube',
  aspect_ratio: '16:9',
  language: 'en',
  target_duration_sec: 120,
  video_type: 'crypto_analysis',
  tone: 'sharp analytical retention focused',
  scenes: [
    {
      scene_id: 'scene_001',
      purpose: 'hook',
      estimated_duration_sec: 8,
      voiceover: 'Bitcoin is back near eighty thousand dollars but the real question is whether this is a breakout or just another leverage trap',
      on_screen_text: 'BTC $80K: Breakout or Trap?',
      visual_type: 'market_chart',
      preferred_asset_source: 'playwright_screenshot',
      asset_keywords: ['bitcoin', 'btc chart', 'market breakout'],
      motion_instruction: 'Fast zoom into a Bitcoin chart with a warning flash'
    },
    {
      scene_id: 'scene_002',
      purpose: 'conflict',
      estimated_duration_sec: 12,
      voiceover: 'When price moves fast traders often confuse momentum with real demand but leverage can make a move look stronger than it really is',
      on_screen_text: 'Momentum is not real demand',
      visual_type: 'text_card',
      preferred_asset_source: 'ai_generated_image',
      asset_keywords: ['leverage', 'market risk', 'crypto trading'],
      motion_instruction: 'Show a clean text card with market alert elements'
    },
    {
      scene_id: 'scene_003',
      purpose: 'explanation',
      estimated_duration_sec: 18,
      voiceover: 'A clean breakout usually needs spot demand ETF inflows and controlled leverage If funding overheats and late longs rush in the market can become fragile',
      on_screen_text: 'Spot demand ETF inflow controlled leverage',
      visual_type: 'checklist',
      preferred_asset_source: 'existing_asset_library',
      asset_keywords: ['bitcoin etf', 'spot demand', 'funding rate'],
      motion_instruction: 'Checklist items appear one by one with subtle impact'
    }
  ],
  required_outputs: [
    'script.json',
    'storyboard.json',
    'timeline.json',
    'asset_manifest.json',
    'voiceover.txt',
    'capcut_handoff_package'
  ]
};

describe('pasted storyboard validation', () => {
  it('accepts valid estimated_duration_sec scenes', () => {
    const result = validatePastedStoryboard(pastedStoryboard);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.storyboard.scenes[0].estimated_duration_sec).toBe(8);
    expect(result.storyboard.scenes[0].visual_type).toBe('chart');
    expect(result.storyboard.scenes[1].preferred_asset_source).toBe('ai_generated');
    expect(result.storyboard.title_description_hashtags.description).toBe(pastedStoryboard.market_context);
  });

  it('normalizes duration_sec alias to estimated_duration_sec', () => {
    const input = {
      ...pastedStoryboard,
      scenes: pastedStoryboard.scenes.map((scene, index) => {
        if (index !== 0) return scene;
        const { estimated_duration_sec, ...rest } = scene;
        return { ...rest, duration_sec: estimated_duration_sec };
      })
    };

    const result = validatePastedStoryboard(input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.storyboard.scenes[0].estimated_duration_sec).toBe(8);
  });

  it('returns a clear error when estimated_duration_sec is missing', () => {
    const input = {
      ...pastedStoryboard,
      scenes: pastedStoryboard.scenes.map((scene, index) => {
        if (index !== 0) return scene;
        const { estimated_duration_sec, ...rest } = scene;
        return rest;
      })
    };

    const result = validatePastedStoryboard(input);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.join('\n')).toContain('Scene 1 is missing estimated_duration_sec');
  });
});
