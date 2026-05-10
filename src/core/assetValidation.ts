import fs from 'node:fs/promises';
import sharp from 'sharp';

export type AssetValidation = {
  asset_url: string | null;
  validation_status: 'valid' | 'invalid' | 'placeholder';
  validation_errors: string[];
  file_size_bytes: number | null;
  width: number | null;
  height: number | null;
};

export function toBrowserAssetUrl(localPath?: string | null) {
  if (!localPath) return null;
  const normalized = localPath.replace(/\\/g, '/');
  const outputsIndex = normalized.indexOf('outputs/');
  if (outputsIndex === -1) return null;
  return `http://localhost:3001/${normalized.slice(outputsIndex)}`;
}

export async function validateImageAsset(localPath: string | null, opts: { isPlaceholder?: boolean } = {}): Promise<AssetValidation> {
  const errors: string[] = [];
  const asset_url = toBrowserAssetUrl(localPath);
  let file_size_bytes: number | null = null;
  let width: number | null = null;
  let height: number | null = null;

  if (!localPath) {
    return {
      asset_url,
      validation_status: 'invalid',
      validation_errors: ['Asset file path is missing.'],
      file_size_bytes,
      width,
      height
    };
  }

  try {
    const stat = await fs.stat(localPath);
    file_size_bytes = stat.size;
    if (!stat.isFile()) errors.push('Asset path is not a file.');
    if (!opts.isPlaceholder && stat.size < 30_000) {
      errors.push(`Asset file is too small for a real image (${stat.size} bytes).`);
    }
  } catch {
    errors.push('Asset file does not exist.');
  }

  try {
    const image = sharp(localPath);
    const metadata = await image.metadata();
    width = metadata.width ?? null;
    height = metadata.height ?? null;
    if (!width || !height) errors.push('Asset image dimensions are missing.');

    if (!opts.isPlaceholder) {
      const stats = await image.resize(32, 32, { fit: 'fill' }).raw().toBuffer();
      let min = 255;
      let max = 0;
      const colors = new Set<string>();
      for (let i = 0; i < stats.length; i += 3) {
        const r = stats[i];
        const g = stats[i + 1];
        const b = stats[i + 2];
        min = Math.min(min, r, g, b);
        max = Math.max(max, r, g, b);
        colors.add(`${Math.round(r / 16)},${Math.round(g / 16)},${Math.round(b / 16)}`);
      }
      if (max - min < 24 || colors.size < 8) {
        errors.push('Asset image appears near-empty or single-color.');
      }
    }
  } catch {
    errors.push('Asset file is not a readable image.');
  }

  if (!asset_url) errors.push('Asset URL cannot be exposed through /outputs.');

  return {
    asset_url,
    validation_status: opts.isPlaceholder ? 'placeholder' : errors.length ? 'invalid' : 'valid',
    validation_errors: errors,
    file_size_bytes,
    width,
    height
  };
}

export function applyValidation(asset: any, validation: AssetValidation) {
  asset.asset_url = validation.asset_url;
  asset.validation_status = validation.validation_status;
  asset.validation_errors = validation.validation_errors;
  asset.file_size_bytes = validation.file_size_bytes;
  asset.width = validation.width;
  asset.height = validation.height;
}
