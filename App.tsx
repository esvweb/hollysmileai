import React, { useState } from 'react';
import { Uploader } from './components/Uploader';
import { generateSmileMakeover } from './services/geminiService';
import { addWatermark } from './utils/watermark';
import { ProcessingState } from './types';

function App() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [processingState, setProcessingState] = useState<ProcessingState>({ status: 'idle' });

  const handleImageUpload = async (base64: string) => {
    setOriginalImage(base64);
    setGeneratedImage(null);
    setProcessingState({ status: 'processing', message: 'Analyzing facial structure...' });

    try {
      // Simulate steps for UX
      setTimeout(() => setProcessingState(p => ({ ...p, message: 'Identifying teeth geometry...' })), 1500);
      setTimeout(() => setProcessingState(p => ({ ...p, message: 'Designing smile makeover...' })), 3500);
      setTimeout(() => setProcessingState(p => ({ ...p, message: 'Applying Esvita perfection...' })), 5500);

      // 1. Generate AI Smile
      const rawResult = await generateSmileMakeover(base64);
      
      // 2. Add Watermark
      setProcessingState(p => ({ ...p, message: 'Finalizing simulation...' }));
      const watermarkedResult = await addWatermark(rawResult);

      setGeneratedImage(watermarkedResult);
      setProcessingState({ status: 'success' });
    } catch (error: any) {
      setProcessingState({ 
        status: 'error', 
        message: error.message || "Failed to generate smile. Ensure your API key is set and valid." 
      });
    }
  };

  const resetApp = () => {
    setOriginalImage(null);
    setGeneratedImage(null);
    setProcessingState({ status: 'idle' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="https://esvitaclinic.com/wp-content/uploads/2025/06/esvita-logo.svg" 
              alt="Esvita Clinic" 
              className="h-8 sm:h-10 w-auto object-contain"
            />
            <div className="hidden sm:block h-6 w-px bg-slate-200 mx-1"></div>
            <h1 className="hidden sm:block text-xl font-bold tracking-tight bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
              Hollywood Smile AI
            </h1>
          </div>
          {originalImage && (
            <button 
              onClick={resetApp}
              className="text-sm font-medium text-slate-500 hover:text-teal-600 transition-colors"
            >
              Start Over
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center p-4 sm:p-8">
        
        {/* Intro Section (Hidden if image uploaded) */}
        {!originalImage && (
          <div className="text-center max-w-2xl mx-auto mb-12 animate-fade-in-up">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
              Visualize your perfect <br/>
              <span className="text-teal-500">Smile Makeover</span>
            </h2>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              Upload a selfie and let our advanced AI simulate a high-end cosmetic dentistry makeover in seconds. 
              Whitening, alignment, and perfect shape reconstruction.
            </p>
          </div>
        )}

        {/* Upload Area */}
        {!originalImage && (
          <Uploader onImageSelected={handleImageUpload} />
        )}

        {/* Processing State */}
        {processingState.status === 'processing' && originalImage && (
          <div className="w-full max-w-2xl bg-white p-8 rounded-2xl shadow-xl text-center border border-slate-100">
             <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-teal-500 rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-teal-500">
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                   </svg>
                </div>
             </div>
             <h3 className="text-xl font-semibold text-slate-800 mb-2">{processingState.message}</h3>
             <p className="text-slate-500 text-sm">This typically takes 5-10 seconds.</p>
          </div>
        )}

        {/* Error State */}
        {processingState.status === 'error' && (
          <div className="max-w-lg w-full bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Generation Failed</h3>
            <p className="text-red-600 mb-6">{processingState.message}</p>
            <button 
              onClick={resetApp}
              className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors shadow-lg hover:shadow-red-500/20"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Result View - No Slider, Just Watermarked Image */}
        {processingState.status === 'success' && generatedImage && (
          <div className="flex flex-col items-center w-full animate-fade-in">
            <div className="w-full max-w-2xl mx-auto rounded-xl overflow-hidden shadow-2xl border-4 border-white">
              <img 
                src={generatedImage} 
                alt="Esvita Smile Simulation Result" 
                className="w-full h-auto object-contain"
              />
            </div>
            
            <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full max-w-md">
               <a 
                 href={generatedImage} 
                 download="esvita-smile-makeover.png"
                 className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                 </svg>
                 Download Result
               </a>
               <button 
                 onClick={resetApp}
                 className="flex-1 bg-white text-slate-700 border border-slate-300 px-6 py-3 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
               >
                 New Photo
               </button>
            </div>
            
            <p className="mt-8 text-xs text-slate-400 text-center max-w-lg">
              *Disclaimer: This is an AI simulation for entertainment and visualization purposes only. 
              Actual dental results vary. Consult a professional dentist for medical advice.
            </p>
          </div>
        )}
      </main>

      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-teal-200/20 rounded-full blur-[100px]"></div>
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-blue-200/20 rounded-full blur-[100px]"></div>
      </div>
    </div>
  );
}

export default App;