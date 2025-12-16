import React, { useCallback } from 'react';

interface UploaderProps {
  onImageSelected: (base64: string) => void;
  disabled?: boolean;
}

export const Uploader: React.FC<UploaderProps> = ({ onImageSelected, disabled }) => {
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File is too large. Please upload an image under 5MB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        onImageSelected(result);
      };
      reader.readAsDataURL(file);
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
          <p className="text-xs text-gray-400 mt-2">JPG, PNG or WEBP (MAX. 5MB)</p>
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
