# CapCut Handoff MVP v0.1

## Project Overview
CapCut Handoff is a local MVP that converts a topic or storyboard into a semi-finished edit package for CapCut.

## What This MVP Does
- Validates input JSON.
- Generates storyboard with OpenAI or fallback storyboard.
- Builds and resolves scene assets.
- Allows review/approve/reject/refetch/upload via web UI.
- Renders a rough cut MP4 with ffmpeg.
- Exports manifest/script/metadata files for CapCut finishing.

## What This MVP Does Not Do
Automatic TTS, subtitles, CapCut API integration, advanced transitions/motion graphics, multi-track editing, publishing, auth, cloud storage, payments, team features, copyright detection.

## Installation
```bash
npm install
pip install -r requirements.txt
```

## Environment Variables
Copy `.env.example` to `.env` and configure.

## Install Playwright Browsers
```bash
npm run install:browsers
```

## Install ffmpeg
Install ffmpeg and ensure `ffmpeg` is on PATH.

## Run CLI
```bash
npm run generate
```

## Run Web UI
```bash
npm run dev
```
UI: http://localhost:5173
Backend: http://localhost:3001

## Input File Format
See `inputs/sample_input.json`.

## Storyboard Format
See `inputs/fallback_storyboard.json` and schema in `src/schemas/storyboardSchema.ts`.

## Output Files
Each run writes `outputs/{project_id}/` containing:
- `rough_cut.mp4`
- `storyboard.json`
- `asset_list.json`
- `edit_manifest.json`
- `capcut_voiceover_script.txt`
- `title_description_hashtags.txt`
- `assets/`

## Fallback Behavior
Missing API key / OpenAI error / invalid JSON / invalid storyboard all fallback to local storyboard.

## How to Use the Output in CapCut
1. Open CapCut.
2. Import `rough_cut.mp4`.
3. Use `capcut_voiceover_script.txt` to generate TTS.
4. Use CapCut auto captions.
5. Use `edit_manifest.json` to adjust timing and assets.
6. Export final video from CapCut.

## Common Errors
- Missing ffmpeg: install ffmpeg and add to PATH.
- Playwright capture failure: placeholder is auto-generated.
- Upload failure: re-upload via UI.
