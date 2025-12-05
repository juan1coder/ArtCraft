import React, { memo } from 'react';
import { Persona, Style } from '../types';
import { PlusIcon, CheckIcon, EditIcon } from './Icons';

interface SidebarProps {
  modelName: string;
  setModelName: (name: string) => void;
  personas: Persona[];
  selectedPersonaId: string;
  setSelectedPersonaId: (id: string) => void;
  styles: Style[];
  selectedStyleIds: Set<string>;
  toggleStyle: (id: string) => void;
  onOpenModal: (type: 'persona' | 'style') => void;
  onEditItem: (type: 'persona' | 'style', item: Persona | Style) => void;
  onOpenExport: () => void;
}

const CodeIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
);

export const Sidebar = memo(({ 
  modelName, setModelName, 
  personas, selectedPersonaId, setSelectedPersonaId, 
  styles, selectedStyleIds, toggleStyle, 
  onOpenModal, onEditItem, onOpenExport
}: SidebarProps) => (
  <div className="w-full md:w-80 bg-zinc-900 border-r border-zinc-800 flex flex-col h-full overflow-hidden">
    <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
      <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">
        ArtGen Studio
      </h1>
      <div className="text-xs text-zinc-500 font-mono">v2.4</div>
    </div>

    <div className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar">
      
      {/* Model Selector */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Model</label>
        <select 
          value={modelName}
          onChange={(e) => setModelName(e.target.value)}
          className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-emerald-500 outline-none text-zinc-300"
        >
          <option value="gemini-2.5-flash">gemini-2.5-flash (Fast)</option>
          <option value="gemini-2.5-flash-lite-latest">gemini-2.5-flash-lite (Faster)</option>
          <option value="gemini-3-pro-preview">gemini-3-pro-preview (Complex)</option>
        </select>
      </div>

      {/* Persona Selector */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
           <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Persona</label>
           <button onClick={() => onOpenModal('persona')} className="text-zinc-500 hover:text-emerald-400 transition-colors" title="Add Custom Persona">
              <PlusIcon className="w-4 h-4" />
           </button>
        </div>
        <div className="space-y-1">
          {personas.map(p => (
            <div 
              key={p.id} 
              className={`group flex items-center w-full rounded text-sm transition-all border ${
                selectedPersonaId === p.id 
                  ? 'bg-emerald-500/10 border-emerald-500/50' 
                  : 'bg-zinc-950/50 border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700'
              }`}
            >
              <button
                onClick={() => setSelectedPersonaId(p.id)}
                className={`flex-1 text-left px-3 py-2 min-w-0 ${selectedPersonaId === p.id ? 'text-emerald-400' : 'text-zinc-400'}`}
              >
                <div className="font-medium truncate">{p.name}</div>
                <div className="text-[10px] opacity-60 truncate">{p.description}</div>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onEditItem('persona', p); }}
                className="p-2 text-zinc-600 hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity"
                title="View / Edit Details"
              >
                <EditIcon className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Style Selector */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
           <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Styles ({selectedStyleIds.size})</label>
           <button onClick={() => onOpenModal('style')} className="text-zinc-500 hover:text-purple-400 transition-colors" title="Add Custom Style">
              <PlusIcon className="w-4 h-4" />
           </button>
        </div>
        <div className="grid grid-cols-1 gap-1">
          {styles.map(s => {
            const isSelected = selectedStyleIds.has(s.id);
            return (
              <div
                key={s.id}
                className={`group flex items-center w-full rounded text-sm transition-all border ${
                  isSelected 
                    ? 'bg-purple-500/10 border-purple-500/50' 
                    : 'bg-zinc-950/50 border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700'
                }`}
              >
                <button
                  onClick={() => toggleStyle(s.id)}
                  className={`flex-1 text-left px-3 py-2 flex items-center gap-2 min-w-0 ${isSelected ? 'text-purple-400' : 'text-zinc-400'}`}
                >
                  <div className={`w-3 h-3 rounded-sm border flex items-center justify-center shrink-0 ${isSelected ? 'border-purple-500 bg-purple-500' : 'border-zinc-600'}`}>
                    {isSelected && <CheckIcon className="w-2 h-2 text-white" />}
                  </div>
                  <span className="truncate">{s.name}</span>
                </button>
                 <button 
                  onClick={(e) => { e.stopPropagation(); onEditItem('style', s); }}
                  className="p-2 text-zinc-600 hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="View / Edit Details"
                >
                  <EditIcon className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>

    {/* Sidebar Footer: Dev Export */}
    <div className="p-4 border-t border-zinc-800 bg-zinc-950/50">
       <button 
         onClick={onOpenExport}
         className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded text-xs font-medium text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors border border-transparent hover:border-zinc-700"
         title="Export current Personas and Styles to TypeScript code for hard-wiring"
       >
         <CodeIcon className="w-4 h-4" />
         Developer Export
       </button>
    </div>
  </div>
));