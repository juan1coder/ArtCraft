import React, { useState } from 'react';
import { Persona, Style } from '../types';
import { generatePersonaCode, generateStyleCode } from '../utils/exportUtils';
import { CopyIcon, CheckIcon } from './Icons';

interface CodeExportModalProps {
  onClose: () => void;
  personas: Persona[];
  styles: Style[];
}

export const CodeExportModal = ({ onClose, personas, styles }: CodeExportModalProps) => {
  const [activeTab, setActiveTab] = useState<'personas' | 'styles'>('personas');
  const [copied, setCopied] = useState(false);

  const code = activeTab === 'personas' 
    ? generatePersonaCode(personas) 
    : generateStyleCode(styles);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-3xl shadow-2xl flex flex-col h-[80vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900 rounded-t-xl">
          <div>
            <h3 className="text-lg font-bold text-white">Developer Code Export</h3>
            <p className="text-xs text-zinc-400 mt-1">
                Copy this code into <span className="font-mono text-emerald-400">config/{activeTab}.ts</span> to hard-wire your custom items.
            </p>
          </div>
          <div className="flex bg-zinc-800 rounded-lg p-1">
            <button 
              onClick={() => setActiveTab('personas')}
              className={`px-4 py-1.5 text-xs font-medium rounded transition-all ${activeTab === 'personas' ? 'bg-zinc-600 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              Personas
            </button>
            <button 
              onClick={() => setActiveTab('styles')}
              className={`px-4 py-1.5 text-xs font-medium rounded transition-all ${activeTab === 'styles' ? 'bg-zinc-600 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              Styles
            </button>
          </div>
        </div>

        {/* Code View */}
        <div className="flex-1 overflow-hidden relative bg-[#0d0d0d]">
           <pre className="w-full h-full overflow-auto p-6 text-xs font-mono leading-relaxed text-zinc-300 custom-scrollbar">
             <code>{code}</code>
           </pre>
           <button 
              onClick={handleCopy}
              className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md shadow-lg text-xs font-bold transition-colors"
           >
             {copied ? <><CheckIcon className="w-4 h-4" /> Copied</> : <><CopyIcon className="w-4 h-4" /> Copy Code</>}
           </button>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900 rounded-b-xl flex justify-end">
          <button onClick={onClose} className="px-6 py-2 rounded text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors border border-zinc-700 hover:border-zinc-600">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
