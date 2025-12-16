export const generateSmileMakeover = async (base64Image: string): Promise<string> => {
  try {
    // We now call our own backend API route to keep the API key secure.
    // When deployed to Vercel, this points to the serverless function.
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: base64Image }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.image) {
      throw new Error("No image returned from server.");
    }

    return data.image;
  } catch (error) {
    console.error("Smile Generation Error:", error);
    throw error;
  }
};