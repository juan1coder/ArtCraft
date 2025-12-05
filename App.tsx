
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GoogleGenAI } from '@google/genai';
import { DEFAULT_PERSONAS } from './config/personas';
import { DEFAULT_STYLES } from './config/styles';
import { Persona, Style, LogEntry, AppTab } from './types';
import { TerminalIcon, HistoryIcon, SettingsIcon, DownloadIcon } from './components/Icons';
import { Sidebar } from './components/Sidebar';
import { GeneratorView } from './components/GeneratorView';
import { HistoryView } from './components/HistoryView';
import { CodeExportModal } from './components/CodeExportModal';
import { downloadFile } from './utils/exportUtils';

const API_KEY = process.env.API_KEY || '';

export default function App() {
  // -- State --
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.GENERATOR);
  
  // Data - Lazy initialization with merging strategy
  const [personas, setPersonas] = useState<Persona[]>(() => {
    try {
      const stored = localStorage.getItem('artgen_personas');
      if (stored) {
        return JSON.parse(stored);
      }
      return DEFAULT_PERSONAS;
    } catch (e) {
      console.error("Failed to parse personas", e);
      return DEFAULT_PERSONAS;
    }
  });

  const [styles, setStyles] = useState<Style[]>(() => {
    try {
      const stored = localStorage.getItem('artgen_styles');
      if (stored) {
        return JSON.parse(stored);
      }
      return DEFAULT_STYLES;
    } catch (e) {
      console.error("Failed to parse styles", e);
      return DEFAULT_STYLES;
    }
  });

  const [history, setHistory] = useState<LogEntry[]>(() => {
    try {
      const stored = localStorage.getItem('artgen_history');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });
  
  // Selection
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('default');
  const [selectedStyleIds, setSelectedStyleIds] = useState<Set<string>>(new Set());
  const [modelName, setModelName] = useState<string>('gemini-2.5-flash');
  
  // Inputs & Outputs
  const [prompt, setPrompt] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null); // Base64 Data URL
  const [generatedOutput, setGeneratedOutput] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [streamBuffer, setStreamBuffer] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalType, setModalType] = useState<'persona' | 'style' | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  
  // Refs for scrolling
  const outputEndRef = useRef<HTMLDivElement>(null);

  // -- Persistence --
  useEffect(() => {
    localStorage.setItem('artgen_personas', JSON.stringify(personas));
  }, [personas]);

  useEffect(() => {
    localStorage.setItem('artgen_styles', JSON.stringify(styles));
  }, [styles]);

  useEffect(() => {
      try {
          localStorage.setItem('artgen_history', JSON.stringify(history));
      } catch (e) {
          console.error("Failed to save history to localStorage (likely quota exceeded)", e);
          // Optional: We could try to save without images if quota fails
      }
  }, [history]);

  // Auto-scroll output
  useEffect(() => {
    if (outputEndRef.current) {
        outputEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [streamBuffer]);

  // -- Actions --

  const handleImageSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setSelectedImage(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImageClear = () => {
    setSelectedImage(null);
  };

  const handleGenerate = async () => {
    if ((!prompt.trim() && !selectedImage) || isGenerating) return;
    if (!API_KEY) {
        alert("API Key not found. Please ensure process.env.API_KEY is set.");
        return;
    }

    setIsGenerating(true);
    setGeneratedOutput('');
    setStreamBuffer('');
    setActiveTab(AppTab.GENERATOR);

    const activePersona = personas.find(p => p.id === selectedPersonaId) || personas[0];
    const activeStyles = styles.filter(s => selectedStyleIds.has(s.id));
    
    // Construct the prompt similar to the bash script
    const styleText = activeStyles.map(s => s.description).join(', ');
    const fullUserPrompt = styleText 
      ? `${prompt}\n\nStyles applied: ${styleText}` 
      : prompt;

    // System instruction comes from Persona
    const systemInstruction = activePersona.description;

    try {
      const ai = new GoogleGenAI({ apiKey: API_KEY });
      
      // Prepare content payload. If image exists, we must use the 'parts' structure.
      let contents: any;

      if (selectedImage) {
          // Strip "data:image/png;base64," prefix
          const base64Data = selectedImage.split(',')[1];
          const mimeType = selectedImage.split(';')[0].split(':')[1];

          contents = {
              parts: [
                  {
                      inlineData: {
                          mimeType: mimeType,
                          data: base64Data
                      }
                  },
                  { text: fullUserPrompt || " " } // Ensure text part exists even if prompt is empty
              ]
          };
      } else {
          contents = fullUserPrompt;
      }

      const response = await ai.models.generateContentStream({
        model: modelName,
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
        },
      });

      let accumulatedText = '';

      for await (const chunk of response) {
        const text = chunk.text;
        if (text) {
            accumulatedText += text;
            setStreamBuffer(prev => prev + text);
        }
      }

      setGeneratedOutput(accumulatedText);

      // Log to history
      const newLog: LogEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleString(),
        model: modelName,
        personaName: activePersona.name,
        styles: activeStyles.map(s => s.name),
        input: prompt,
        fullPrompt: fullUserPrompt,
        response: accumulatedText,
        image: selectedImage || undefined
      };

      // Robust history updating handling quota limits
      setHistory(prev => {
          const newHistory = [newLog, ...prev];
          try {
              // Test serialization to see if it fits
              JSON.stringify(newHistory);
              return newHistory;
          } catch (e) {
              console.warn("Storage quota exceeded with image. Saving log without image.");
              const logWithoutImage = { ...newLog, image: undefined };
              return [logWithoutImage, ...prev];
          }
      });

    } catch (error) {
      console.error("Generation failed:", error);
      setStreamBuffer(prev => prev + `\n\nError generating content: ${error}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleStyle = (id: string) => {
    const newSet = new Set(selectedStyleIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedStyleIds(newSet);
  };

  const handleClearPrompt = () => {
    setPrompt('');
    setSelectedImage(null);
  };

  const handleSaveItem = () => {
    if (!newItemName.trim() || !newItemDesc.trim()) return;
    
    if (editingItemId) {
      // Update existing item
      if (modalType === 'persona') {
        setPersonas(prev => prev.map(p => p.id === editingItemId ? { ...p, name: newItemName, description: newItemDesc } : p));
      } else {
        setStyles(prev => prev.map(s => s.id === editingItemId ? { ...s, name: newItemName, description: newItemDesc } : s));
      }
    } else {
      // Create new item
      const newItem = {
          id: Date.now().toString(),
          name: newItemName,
          description: newItemDesc
      };

      if (modalType === 'persona') {
          setPersonas([...personas, newItem]);
      } else {
          setStyles([...styles, newItem]);
      }
    }
    
    closeModal();
  };

  const handleDownloadCurrentItem = () => {
    if (!newItemName.trim()) {
        alert("Please enter a name before downloading.");
        return;
    }
    const content = JSON.stringify({
        name: newItemName,
        description: newItemDesc
    }, null, 2);
    
    const safeName = newItemName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `${modalType}_${safeName}.json`;
    
    downloadFile(content, filename, 'application/json');
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNewItemName('');
    setNewItemDesc('');
    setModalType(null);
    setEditingItemId(null);
  };

  const deleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const clearHistory = () => {
    if(confirm("Clear all history logs?")) {
        setHistory([]);
    }
  };

  const handleOpenModal = (type: 'persona' | 'style') => {
      setModalType(type);
      setEditingItemId(null);
      setNewItemName('');
      setNewItemDesc('');
      setIsModalOpen(true);
  }

  const handleEditItem = (type: 'persona' | 'style', item: Persona | Style) => {
      setModalType(type);
      setEditingItemId(item.id);
      setNewItemName(item.name);
      setNewItemDesc(item.description);
      setIsModalOpen(true);
  }

  // Helpers for Child Components (Memoized to prevent unnecessary re-renders)
  const activePersonaName = useMemo(() => 
    personas.find(p => p.id === selectedPersonaId)?.name, 
    [personas, selectedPersonaId]
  );
  
  const activeStyleNames = useMemo(() => 
    styles.filter(s => selectedStyleIds.has(s.id)).map(s => s.name),
    [styles, selectedStyleIds]
  );

  return (
    <div className="flex h-screen w-full bg-black text-zinc-200 overflow-hidden">
      {/* Left Sidebar (Desktop) */}
      <div className="hidden md:block h-full">
          <Sidebar 
             modelName={modelName}
             setModelName={setModelName}
             personas={personas}
             selectedPersonaId={selectedPersonaId}
             setSelectedPersonaId={setSelectedPersonaId}
             styles={styles}
             selectedStyleIds={selectedStyleIds}
             toggleStyle={toggleStyle}
             onOpenModal={handleOpenModal}
             onEditItem={handleEditItem}
             onOpenExport={() => setIsExportModalOpen(true)}
          />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile Header / Nav */}
          <div className="md:hidden flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900">
              <div className="font-bold text-emerald-400">ArtGen Studio</div>
              <div className="flex gap-4">
                  <button onClick={() => setActiveTab(AppTab.GENERATOR)} className={activeTab === AppTab.GENERATOR ? 'text-white' : 'text-zinc-600'}>
                      <TerminalIcon className="w-5 h-5" />
                  </button>
                  <button onClick={() => setActiveTab(AppTab.CONFIG)} className={activeTab === AppTab.CONFIG ? 'text-white' : 'text-zinc-600'}>
                      <SettingsIcon className="w-5 h-5" />
                  </button>
                  <button onClick={() => setActiveTab(AppTab.HISTORY)} className={activeTab === AppTab.HISTORY ? 'text-white' : 'text-zinc-600'}>
                      <HistoryIcon className="w-5 h-5" />
                  </button>
              </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden relative">
              {/* In Desktop mode, we split. In Mobile, we toggle. */}
              <div className="hidden md:flex h-full">
                  <div className="flex-1 border-r border-zinc-800">
                      <GeneratorView 
                          prompt={prompt}
                          setPrompt={setPrompt}
                          handleGenerate={handleGenerate}
                          onClear={handleClearPrompt}
                          isGenerating={isGenerating}
                          modelName={modelName}
                          activePersonaName={activePersonaName}
                          activeStyleNames={activeStyleNames}
                          streamBuffer={streamBuffer}
                          outputEndRef={outputEndRef}
                          selectedImage={selectedImage}
                          onImageSelect={handleImageSelect}
                          onImageClear={handleImageClear}
                      />
                  </div>
                  <div className={`w-[400px] transition-all duration-300 ${activeTab === AppTab.HISTORY ? 'mr-0' : '-mr-[400px]'} bg-zinc-950 border-l border-zinc-800`}>
                      <HistoryView 
                        history={history}
                        deleteHistoryItem={deleteHistoryItem}
                        clearHistory={clearHistory}
                      />
                  </div>
                  {/* Toggle for history panel desktop */}
                  <div className="absolute top-4 right-4 z-20">
                      <button 
                        onClick={() => setActiveTab(activeTab === AppTab.HISTORY ? AppTab.GENERATOR : AppTab.HISTORY)}
                        className={`p-2 rounded-md border ${activeTab === AppTab.HISTORY ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'}`}
                        title="Toggle History Log"
                      >
                          <HistoryIcon className="w-5 h-5" />
                      </button>
                  </div>
              </div>

              {/* Mobile View Logic */}
              <div className="md:hidden h-full">
                  {activeTab === AppTab.GENERATOR && (
                      <GeneratorView 
                          prompt={prompt}
                          setPrompt={setPrompt}
                          handleGenerate={handleGenerate}
                          onClear={handleClearPrompt}
                          isGenerating={isGenerating}
                          modelName={modelName}
                          activePersonaName={activePersonaName}
                          activeStyleNames={activeStyleNames}
                          streamBuffer={streamBuffer}
                          outputEndRef={outputEndRef}
                          selectedImage={selectedImage}
                          onImageSelect={handleImageSelect}
                          onImageClear={handleImageClear}
                      />
                  )}
                  {activeTab === AppTab.CONFIG && (
                      <div className="h-full">
                          <Sidebar 
                             modelName={modelName}
                             setModelName={setModelName}
                             personas={personas}
                             selectedPersonaId={selectedPersonaId}
                             setSelectedPersonaId={setSelectedPersonaId}
                             styles={styles}
                             selectedStyleIds={selectedStyleIds}
                             toggleStyle={toggleStyle}
                             onOpenModal={handleOpenModal}
                             onEditItem={handleEditItem}
                             onOpenExport={() => setIsExportModalOpen(true)}
                          />
                      </div>
                  )}
                  {activeTab === AppTab.HISTORY && (
                      <HistoryView 
                        history={history}
                        deleteHistoryItem={deleteHistoryItem}
                        clearHistory={clearHistory}
                      />
                  )}
              </div>
          </div>
      </div>

      {/* Add/Edit Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-md shadow-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">
                    {editingItemId ? 'Edit' : 'Add New'} {modalType === 'persona' ? 'Persona' : 'Style'}
                </h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs uppercase font-bold text-zinc-500 mb-1">Name</label>
                        <input 
                            type="text" 
                            value={newItemName}
                            onChange={e => setNewItemName(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-sm focus:border-emerald-500 outline-none"
                            placeholder={`e.g., ${modalType === 'persona' ? 'Neon Noir Detective' : 'Vaporwave Glitch'}`}
                        />
                    </div>
                    <div>
                        <label className="block text-xs uppercase font-bold text-zinc-500 mb-1">
                            {modalType === 'persona' ? 'System Prompt / Description' : 'Tokens / Tags'}
                        </label>
                        <textarea 
                            value={newItemDesc}
                            onChange={e => setNewItemDesc(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-sm focus:border-emerald-500 outline-none min-h-[100px]"
                            placeholder={modalType === 'persona' ? "You are an AI designed to..." : "glitch art, vhs effect, scanlines..."}
                        />
                    </div>
                </div>

                <div className="flex justify-between mt-6">
                     <button 
                        onClick={handleDownloadCurrentItem}
                        className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors border border-zinc-700/50"
                        title="Download current configuration as JSON"
                    >
                        <DownloadIcon className="w-4 h-4" />
                        Download Config
                    </button>
                    <div className="flex gap-3">
                        <button onClick={closeModal} className="px-4 py-2 rounded text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">Cancel</button>
                        <button 
                            onClick={handleSaveItem}
                            className="px-4 py-2 rounded text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20"
                        >
                            {editingItemId ? 'Save Changes' : 'Save Item'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Code Export Modal */}
      {isExportModalOpen && (
          <CodeExportModal 
             onClose={() => setIsExportModalOpen(false)}
             personas={personas}
             styles={styles}
          />
      )}
    </div>
  );
}
