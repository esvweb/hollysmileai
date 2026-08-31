import { GoogleGenAI } from "@google/genai";

// Vercel: image generation is slow (Gemini ~6s, OpenAI ~47s).
// Hobby plan allows a maximum of 60s; Pro allows up to 300s.
export const config = {
  maxDuration: 60,
};

const HOLLYWOOD_SMILE_PROMPT = `
You are a world-class digital artist and expert in cosmetic dentistry, tasked with creating a perfect "Hollywood smile" by simulating a high-end Smile Makeover on a user's photo.

**PRIMARY OBJECTIVE: Flawless Teeth Reconstruction**
Your goal is to completely replace the existing teeth with a perfect, idealized set of ultra-white teeth. This involves changing the shape, size, angle, and color of the teeth to create a perfect "Hollywood smile". You have full creative freedom on the teeth.

**CRITICAL RULE: Preserve Everything Else**
This is the most important instruction. You are performing a localized edit on the TEETH ONLY. Every other part of the image must remain absolutely, 100% identical to the original.

**ABSOLUTE PROHIBITIONS (Non-negotiable):**
*   **NO FACIAL HAIR:** Do NOT add any stubble, beards, or mustaches. This is a common and critical error. If the subject does not have facial hair, the output must not have facial hair.
*   **NO SKIN CHANGES:** Do NOT alter skin texture, tone, or color. Do not add or remove moles, freckles, or wrinkles.
*   **NO LIP/GUM CHANGES:** The shape, color, and texture of lips and gums must be perfectly preserved.
*   **IDENTITY PRESERVATION:** The person's identity, facial structure, and all non-teeth features must be unchanged.

**Execution Steps:**
1.  **Identify Teeth:** Precisely locate the teeth in the image.
2.  **Reconstruct Teeth:**
    *   **Alignment & Shape:** Create a perfectly symmetrical and harmonious smile arc for BOTH upper and lower teeth. ALL teeth, including the bottom ones, must be perfectly straight and aligned. Correct ALL rotations, overlaps, and crowding. Every single tooth should be shaped and positioned ideally for a flawless, straight smile.
    *   **Color:** Whiten ALL teeth to a brilliant, dazzling, "Hollywood star" white. The shade must be ABSOLUTELY UNIFORM from the front center teeth all the way to the side back teeth. Critically, ensure the side teeth (premolars/molars) are just as white as the front incisors. There should be NO color gradient, shadow darkening, or yellowing towards the edges of the mouth. Every visible tooth must match the ultra-white shade (BL1) of the front teeth exactly. Correct any lighting shadows that usually make side teeth look darker.
    *   **Perfection:** Eliminate all gaps, chips, and imperfections on the teeth.
3.  **Preserve Background:** Ensure the background, lighting, and all other elements (lips, skin, gums, tongue, glasses, chains, etc.) are identical to the original image.

**Output Requirement:**
*   Your ONLY output is the final edited image. Do not include any text, description, or commentary.
`;

type Provider = 'gemini' | 'openai';

// Pulls the mime type out of a data URL. The uploader accepts png/jpeg/webp,
// so this must not be hardcoded or the model receives a mislabelled image.
const parseDataUrl = (dataUrl: string): { mimeType: string; data: string } => {
  const match = /^data:(image\/(?:png|jpeg|jpg|webp));base64,(.*)$/s.exec(dataUrl);
  if (match) {
    const mimeType = match[1] === 'image/jpg' ? 'image/jpeg' : match[1];
    return { mimeType, data: match[2] };
  }
  // No recognisable prefix: assume a bare base64 JPEG payload.
  return { mimeType: 'image/jpeg', data: dataUrl.replace(/^data:[^;]+;base64,/, '') };
};

const generateWithGemini = async (mimeType: string, data: string): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error('MISSING_KEY_GEMINI');
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { inlineData: { mimeType, data } },
        { text: HOLLYWOOD_SMILE_PROMPT },
      ],
    },
  });

  const parts = response.candidates?.[0]?.content?.parts;
  if (parts) {
    for (const part of parts) {
      if (part.inlineData?.data) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  }

  throw new Error('AI generated no image content.');
};

const generateWithOpenAI = async (mimeType: string, data: string): Promise<string> => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('MISSING_KEY_OPENAI');
  }

  const model = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2';
  // "medium" costs ~$0.062 and takes ~47s; "low" is ~$0.007 and ~21s but visibly
  // softer. Drop to "low" if the 60s function ceiling becomes a problem.
  const quality = process.env.OPENAI_IMAGE_QUALITY || 'medium';

  const buffer = Buffer.from(data, 'base64');
  const extension = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';

  const form = new FormData();
  form.append('model', model);
  form.append('image', new Blob([buffer], { type: mimeType }), `input.${extension}`);
  form.append('prompt', HOLLYWOOD_SMILE_PROMPT);
  // "auto" keeps the aspect ratio of the upload instead of forcing a square.
  form.append('size', 'auto');
  form.append('quality', quality);

  const response = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: form,
  });

  const payload: any = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.error?.message || `OpenAI request failed (${response.status})`);
  }

  const b64 = payload?.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error('AI generated no image content.');
  }

  return `data:image/png;base64,${b64}`;
};

// Turns provider/SDK errors into something a patient can actually read.
// The raw upstream JSON used to be shown verbatim in the UI.
const toUserMessage = (error: any, provider: Provider): string => {
  const raw = typeof error?.message === 'string' ? error.message : String(error ?? '');
  const label = provider === 'openai' ? 'OpenAI' : 'Gemini';

  if (raw === 'MISSING_KEY_GEMINI') {
    return 'Gemini is not configured on the server (API_KEY is missing).';
  }
  if (raw === 'MISSING_KEY_OPENAI') {
    return 'OpenAI is not configured on the server (OPENAI_API_KEY is missing).';
  }
  if (/quota|RESOURCE_EXHAUSTED|prepayment|billing|insufficient_quota|429/i.test(raw)) {
    return `The ${label} account has run out of credit. Please top up the balance and try again.`;
  }
  if (/rate.?limit/i.test(raw)) {
    return `Too many requests right now. Please wait a moment and try again.`;
  }
  if (/API key not valid|invalid_api_key|API_KEY_INVALID|incorrect api key|unauthorized|401/i.test(raw)) {
    return `The ${label} API key is invalid. Please check the server configuration.`;
  }
  if (/safety|blocked|content.?policy|moderation/i.test(raw)) {
    return 'The photo could not be processed. Please try a clear, well-lit photo showing your smile.';
  }
  if (/timeout|timed out|ETIMEDOUT|aborted/i.test(raw)) {
    return 'The request took too long. Please try again with a smaller photo.';
  }
  if (raw === 'AI generated no image content.') {
    return 'No smile could be generated from this photo. Please try another one showing your teeth clearly.';
  }
  return `Something went wrong on the ${label} side. Please try again.`;
};

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const provider: Provider = req.body?.provider === 'openai' ? 'openai' : 'gemini';

  try {
    const { image } = req.body ?? {};

    if (!image || typeof image !== 'string') {
      return res.status(400).json({ error: 'No image provided' });
    }

    const { mimeType, data } = parseDataUrl(image);

    const resultImage = provider === 'openai'
      ? await generateWithOpenAI(mimeType, data)
      : await generateWithGemini(mimeType, data);

    return res.status(200).json({ image: resultImage, provider });
  } catch (error: any) {
    // Keep the full upstream detail in the server log, send a clean line to the client.
    console.error(`Server API Error [${provider}]:`, error);
    return res.status(500).json({ error: toUserMessage(error, provider), provider });
  }
}
