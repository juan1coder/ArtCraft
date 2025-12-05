
import React, { memo, useState, useRef } from 'react';
import { TerminalIcon, PlayIcon, TrashIcon, CopyIcon, CheckIcon, ImageIcon, XCircleIcon, DownloadIcon } from './Icons';
import { downloadFile } from '../utils/exportUtils';

interface GeneratorViewProps {
  prompt: string;
  setPrompt: (s: string) => void;
  handleGenerate: () => void;
  onClear: () => void;
  isGenerating: boolean;
  modelName: string;
  activePersonaName: string | undefined;
  activeStyleNames: string[];
  streamBuffer: string;
  outputEndRef: React.RefObject<HTMLDivElement | null>;
  selectedImage: string | null;
  onImageSelect: (file: File) => void;
  onImageClear: () => void;
}

export const GeneratorView = memo(({
  prompt, setPrompt, handleGenerate, onClear, isGenerating,
  modelName, activePersonaName, activeStyleNames,
  streamBuffer, outputEndRef, selectedImage, onImageSelect, onImageClear
}: GeneratorViewProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopy = () => {
    if (!streamBuffer) return;
    navigator.clipboard.writeText(streamBuffer);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!streamBuffer) return;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    downloadFile(streamBuffer, `ArtGen_Output_${timestamp}.txt`, 'text/plain');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageSelect(e.target.files[0]);
    }
  };

  // Stats Logic
  const charCount = streamBuffer.length;
  // Split by whitespace and filter out empty strings to get word count
  const wordCount = streamBuffer.trim() ? streamBuffer.trim().split(/\s+/).length : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Input Area */}
      <div className="p-6 border-b border-zinc-800 bg-zinc-950/50">
        <label className="text-sm text-zinc-400 mb-2 block font-medium">Base Prompt Concept</label>
        <div className="relative">
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your idea here (e.g., 'A ghostly woman in trance looking up in a portrait style')..."
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-4 text-zinc-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none min-h-[120px] resize-none font-mono text-sm leading-relaxed custom-scrollbar"
            />
            
            {/* Image Preview */}
            {selectedImage && (
              <div className="absolute bottom-16 left-4 z-10">
                <div className="relative group">
                  <img 
                    src={selectedImage} 
                    alt="Selected" 
                    className="w-16 h-16 object-cover rounded-md border border-zinc-600 shadow-lg"
                  />
                  <button 
                    onClick={onImageClear}
                    className="absolute -top-2 -right-2 bg-zinc-900 text-red-400 rounded-full p-0.5 border border-zinc-700 shadow-md hover:text-red-300 transition-colors"
                  >
                    <XCircleIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="absolute bottom-4 right-4 flex items-center gap-3">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
              <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isGenerating}
                  className="px-3 py-2 rounded-md text-xs font-medium text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 transition-colors flex items-center gap-1"
                  title="Attach Image"
              >
                  <ImageIcon className="w-4 h-4" />
                  {selectedImage ? 'Change' : 'Image'}
              </button>

              <button
                  onClick={onClear}
                  disabled={isGenerating || (!prompt && !selectedImage)}
                  className={`px-3 py-2 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                      !prompt && !selectedImage ? 'text-zinc-600 cursor-not-allowed' : 'text-zinc-400 hover:text-red-400 hover:bg-zinc-800'
                  }`}
                  title="Clear Prompt"
              >
                  <TrashIcon className="w-3 h-3" />
                  Erase
              </button>
              <button
                onClick={handleGenerate}
                disabled={isGenerating || (!prompt.trim() && !selectedImage)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md font-semibold text-sm transition-all ${
                    isGenerating || (!prompt.trim() && !selectedImage)
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20'
                }`}
              >
                {isGenerating ? (
                    <span className="animate-pulse">Processing...</span>
                ) : (
                    <>
                    <PlayIcon className="w-4 h-4 fill-current" />
                    Generate
                    </>
                )}
              </button>
            </div>
        </div>
        
        {/* Summary Pill */}
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-500 font-mono">
            <span>Model: <span className="text-emerald-400">{modelName}</span></span>
            <span>•</span>
            <span>Persona: <span className="text-emerald-400">{activePersonaName || 'None'}</span></span>
            <span>•</span>
            <span>Styles: <span className="text-purple-400">{activeStyleNames.length > 0 ? activeStyleNames.join(', ') : 'None'}</span></span>
            {selectedImage && (
                <>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-blue-400"><ImageIcon className="w-3 h-3" /> Image Attached</span>
                </>
            )}
        </div>
      </div>

      {/* Output Area */}
      <div className="flex-1 overflow-hidden flex flex-col bg-[#0c0c0e] relative">
        <div className="absolute top-0 left-0 w-full h-6 bg-gradient-to-b from-[#0c0c0e] to-transparent pointer-events-none z-10"></div>
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar font-mono">
           {streamBuffer ? (
               <div className="whitespace-pre-wrap text-zinc-300 leading-7">
                   {streamBuffer}
                   {isGenerating && <span className="inline-block w-2 h-4 ml-1 bg-emerald-500 animate-pulse align-middle"></span>}
               </div>
           ) : (
               <div className="h-full flex flex-col items-center justify-center text-zinc-700 gap-4">
                   <TerminalIcon className="w-16 h-16 opacity-20" />
                   <p className="text-sm">Ready to generate. Output will stream here.</p>
               </div>
           )}
           <div ref={outputEndRef} />
        </div>
        
        {streamBuffer && (
            <div className="p-4 border-t border-zinc-800 flex items-center justify-end gap-4 bg-zinc-950/80 backdrop-blur-sm">
                
                {/* Word & Char Counter */}
                <div className="text-[10px] text-zinc-500 font-mono border-r border-zinc-800 pr-4 mr-2 h-full flex items-center select-none">
                    <span className="text-zinc-400 font-bold">{wordCount}</span>
                    <span className="ml-1">words</span>
                    <span className="mx-2 text-zinc-700">|</span>
                    <span className="text-zinc-400 font-bold">{charCount}</span>
                    <span className="ml-1">chars</span>
                </div>

                <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-transparent transition-all duration-300"
                    title="Download as .txt"
                >
                    <DownloadIcon className="w-3 h-3" /> Download
                </button>
                
                <button 
                    onClick={handleCopy}
                    className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded transition-all duration-300 ${
                        isCopied 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-transparent'
                    }`}
                >
                    {isCopied ? (
                        <>
                            <CheckIcon className="w-3 h-3" /> Copied!
                        </>
                    ) : (
                        <>
                            <CopyIcon className="w-3 h-3" /> Copy Output
                        </>
                    )}
                </button>
            </div>
        )}
      </div>
    </div>
  );
});
