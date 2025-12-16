export const addWatermark = async (base64Image: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Watermark text
      const text = "Esvita Clinic Smile Simulation";
      
      // Calculate font size (approx 2.5% of image width, min 14px for readability)
      const fontSize = Math.max(14, Math.floor(img.width * 0.025));
      ctx.font = `600 ${fontSize}px Inter, sans-serif`;
      
      // Measure text for spacing calculations
      const metrics = ctx.measureText(text);
      const textWidth = metrics.width;
      
      // Configuration for tiling pattern
      const angle = -30 * Math.PI / 180; // -30 degrees rotation
      const horizontalSpacing = textWidth + (img.width * 0.1); // Horizontal distance between text starts
      const verticalSpacing = fontSize * 8; // Vertical distance between lines
      
      // Styling: Semi-transparent white with shadow for visibility on both light/dark areas
      ctx.fillStyle = "rgba(255, 255, 255, 0.25)"; 
      ctx.shadowColor = "rgba(0, 0, 0, 0.4)"; 
      ctx.shadowBlur = 3;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      // Rotate coordinate system around the center
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(angle);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);

      // Calculate necessary coverage area to fill canvas after rotation
      // Using diagonal length ensures corners are covered
      const diag = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height);
      
      // Define loop bounds relative to the rotated center
      // We go from negative diagonal to positive diagonal to ensure full coverage
      const startPos = -diag;
      const endPos = diag * 1.5;

      // Draw tiled text
      for (let y = startPos; y < endPos; y += verticalSpacing) {
        // Create a brick-like pattern by offsetting every other row
        const rowOffset = (Math.floor(y / verticalSpacing) % 2) === 0 ? 0 : horizontalSpacing / 2;
        
        for (let x = startPos; x < endPos; x += horizontalSpacing) {
           ctx.fillText(text, x + rowOffset, y);
        }
      }

      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = (e) => reject(new Error('Failed to load image for watermarking'));
    img.src = base64Image;
  });
};