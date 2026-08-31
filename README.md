<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1zSVTVZ5GKj4HYK9jL_M4oKpUPZ3rJSAJ

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the environment variables (in `.env.local` locally, in Project Settings
   on Vercel):

   | Variable | Required | Default | Notes |
   | --- | --- | --- | --- |
   | `API_KEY` | yes | – | Gemini API key. Needs a project with billing enabled: the image models are not available on the free tier. |
   | `OPENAI_API_KEY` | only for the OpenAI engine | – | Used when the header switch is set to OpenAI. |
   | `GEMINI_IMAGE_MODEL` | no | `gemini-2.5-flash-image` | e.g. `gemini-3.1-flash-image` for the newer generation. |
   | `OPENAI_IMAGE_MODEL` | no | `gpt-image-2` | |
   | `OPENAI_IMAGE_QUALITY` | no | `medium` | `low` is ~2x faster and ~9x cheaper but visibly softer. |

3. Run the app:
   `npm run dev`

## Switching the image engine

The "Powered by ..." label in the top-right corner of the header is a toggle.
Clicking it switches the backend between Gemini and OpenAI, and the choice is
remembered in `localStorage`. It is meant for comparing output quality on real
photos, not as a customer-facing control.

Measured on this project (see `api/generate.ts`):

| Engine | Time | Cost per image |
| --- | --- | --- |
| `gemini-2.5-flash-image` | ~6-9s | $0.039 |
| `gpt-image-2` (medium) | ~34-47s | ~$0.062 |
| `gpt-image-2` (low) | ~21s | ~$0.007 |

The OpenAI path runs close to the 60s function ceiling of the Vercel Hobby
plan. If it starts timing out, either set `OPENAI_IMAGE_QUALITY=low` or move
the project to a plan that allows a longer `maxDuration`.
