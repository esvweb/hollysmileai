import { Provider } from '../types';

export const generateSmileMakeover = async (
  base64Image: string,
  provider: Provider = 'gemini',
): Promise<string> => {
  try {
    // We call our own backend route so the API keys stay on the server.
    // The provider switch only tells the backend which one to use.
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: base64Image, provider }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.image) {
      throw new Error('No image returned from server.');
    }

    return data.image;
  } catch (error) {
    console.error('Smile Generation Error:', error);
    throw error;
  }
};
