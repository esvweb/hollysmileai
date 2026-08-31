import React, { useCallback } from 'react';

interface UploaderProps {
  onImageSelected: (base64: string) => void;
  disabled?: boolean;
}

// Vercel rejects any function request body over 4.5MB, and base64 inflates a
// file by ~33%. A 5MB upload therefore became ~6.7MB and failed with a 413
// before it ever reached the model. Downscaling here keeps us well under the
// limit, and also makes generation faster and cheaper.
const MAX_EDGE = 1536;
const JPEG_QUALITY = 0.85;

const downscaleImage = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Could not read the selected file.'));
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();

      img.onerror = () => reject(new Error('Could not read the selected image.'));
      img.onload = () => {
        const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));

        // Small enough already: keep the original bytes untouched.
        if (scale === 1 && dataUrl.length < 3_000_000) {
          resolve(dataUrl);
          return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not process the image.'));
          return;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
      };

      img.src = dataUrl;
    };

    reader.readAsDataURL(file);
  });

export const Uploader: React.FC<UploaderProps> = ({ onImageSelected, disabled }) => {
  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      alert('File is too large. Please upload an image under 20MB.');
      return;
    }

    try {
      onImageSelected(await downscaleImage(file));
    } catch (error: any) {
      alert(error?.message || 'Could not read the selected image.');
    } finally {
      // Allow re-selecting the same file after a reset.
      event.target.value = '';
    }
  }, [onImageSelected]);

  return (
    <div className="w-full max-w-lg mx-auto">
      <label 
        className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer bg-white transition-all duration-300
          ${disabled 
            ? 'border-gray-300 bg-gray-50 opacity-50 cursor-not-allowed' 
            : 'border-teal-300 hover:bg-teal-50 hover:border-teal-500 hover:shadow-lg group'
          }`}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
          <div className={`mb-4 p-4 rounded-full ${disabled ? 'bg-gray-200 text-gray-400' : 'bg-teal-100 text-teal-600 group-hover:scale-110 transition-transform'}`}>
            <svg className="w-8 h-8" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
            </svg>
          </div>
          <p className="mb-2 text-lg font-semibold text-gray-700">Click to upload photo</p>
          <p className="text-sm text-gray-500">Selfies work best. Ensure teeth are visible.</p>
          <p className="text-xs text-gray-400 mt-2">JPG, PNG or WEBP</p>
        </div>
        <input 
          type="file" 
          className="hidden" 
          accept="image/png, image/jpeg, image/webp" 
          onChange={handleFileChange}
          disabled={disabled}
        />
      </label>
    </div>
  );
};
