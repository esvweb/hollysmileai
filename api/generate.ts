import { GoogleGenAI } from "@google/genai";

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

const cleanBase64 = (base64Str: string) => {
  return base64Str.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
};

export default async function handler(req: any, res: any) {
  // Set CORS headers to allow requests from your frontend
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

  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    if (!process.env.API_KEY) {
      return res.status(500).json({ error: 'Server configuration error: API_KEY missing' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-2.5-flash-image';

    const imagePart = {
      inlineData: {
        mimeType: 'image/jpeg',
        data: cleanBase64(image),
      },
    };

    const textPart = {
      text: HOLLYWOOD_SMILE_PROMPT
    };

    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: [imagePart, textPart] },
    });

    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      const parts = candidates[0].content.parts;
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          const resultImage = `data:image/png;base64,${part.inlineData.data}`;
          return res.status(200).json({ image: resultImage });
        }
      }
    }

    throw new Error("AI generated no image content.");

  } catch (error: any) {
    console.error("Server API Error:", error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}