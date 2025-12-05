
import React, { memo, useState } from 'react';
import { LogEntry } from '../types';
import { HistoryIcon, TrashIcon, CopyIcon, CheckIcon, DownloadIcon, ImageIcon } from './Icons';
import { downloadAllAsZip, downloadFile, generateTomlLog, generateTxtLog } from '../utils/exportUtils';

interface HistoryViewProps {
  history: LogEntry[];
  deleteHistoryItem: (id: string) => void;
  clearHistory: () => void;
}

// Individual Copy Button Component to handle state
const HistoryCopyButton = ({ text }: { text: string }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <button 
            onClick={handleCopy}
            className={`text-xs flex items-center gap-1 transition-all duration-200 ${
                isCopied ? 'text-emerald-400 font-medium' : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title={isCopied ? "Copied to clipboard" : "Copy to clipboard"}
        >
            {isCopied ? (
                <>
                    <CheckIcon className="w-3 h-3" /> Copied
                </>
            ) : (
                <>
                    <CopyIcon className="w-3 h-3" /> Copy
                </>
            )}
        </button>
    );
};

export const HistoryView = memo(({ history, deleteHistoryItem, clearHistory }: HistoryViewProps) => {
    const [showDownloads, setShowDownloads] = useState(false);

    const handleDownload = (format: 'json' | 'toml' | 'txt' | 'zip') => {
        const timestamp = new Date().toISOString().split('T')[0];
        
        switch(format) {
            case 'json':
                downloadFile(JSON.stringify(history, null, 2), `ArtGen_Log_${timestamp}.json`, 'application/json');
                break;
            case 'toml':
                downloadFile(generateTomlLog(history), `ArtGen_Log_${timestamp}.toml`, 'text/plain');
                break;
            case 'txt':
                downloadFile(generateTxtLog(history), `ArtGen_Log_${timestamp}.txt`, 'text/plain');
                break;
            case 'zip':
                downloadAllAsZip(history);
                break;
        }
        setShowDownloads(false);
    };

    return (
        <div className="h-full flex flex-col bg-zinc-950">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900">
            <h2 className="font-semibold text-zinc-200 flex items-center gap-2">
                <HistoryIcon className="w-5 h-5" /> Session History
            </h2>
            
            <div className="flex items-center gap-2">
                {/* Download Dropdown */}
                <div className="relative">
                    <button 
                        onClick={() => setShowDownloads(!showDownloads)}
                        disabled={history.length === 0}
                        className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded border transition-colors ${
                            history.length === 0 
                            ? 'text-zinc-600 border-zinc-800 cursor-not-allowed' 
                            : 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20'
                        }`}
                    >
                        <DownloadIcon className="w-3 h-3" /> Export
                    </button>

                    {showDownloads && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 overflow-hidden">
                            <button onClick={() => handleDownload('zip')} className="w-full text-left px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800 border-b border-zinc-800 flex items-center justify-between">
                                <span>Download ZIP Bundle</span>
                                <span className="text-[10px] bg-emerald-600 text-white px-1 rounded">ALL</span>
                            </button>
                            <button onClick={() => handleDownload('json')} className="w-full text-left px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800">JSON format</button>
                            <button onClick={() => handleDownload('toml')} className="w-full text-left px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800">TOML format</button>
                            <button onClick={() => handleDownload('txt')} className="w-full text-left px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800">Plain Text</button>
                        </div>
                    )}
                </div>

                {/* Separator */}
                <div className="h-4 w-px bg-zinc-700 mx-1"></div>

                <button onClick={clearHistory} className="text-xs text-zinc-500 hover:text-red-400 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-400/10 transition-colors">
                    <TrashIcon className="w-3 h-3" /> Clear
                </button>
            </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" onClick={() => setShowDownloads(false)}>
            {history.length === 0 && (
                <div className="text-center text-zinc-600 py-10 flex flex-col items-center gap-2">
                    <HistoryIcon className="w-10 h-10 opacity-20" />
                    <p>No history yet. Generate something!</p>
                </div>
            )}
            {history.map((entry) => (
                <div key={entry.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3 group hover:border-zinc-700 transition-colors">
                    <div className="flex justify-between items-start">
                        <div className="flex gap-2 text-xs text-zinc-500 font-mono">
                            <span>{entry.timestamp}</span>
                            <span className="bg-zinc-800 px-1 rounded text-emerald-500">{entry.model}</span>
                        </div>
                        <button onClick={() => deleteHistoryItem(entry.id)} className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            <TrashIcon className="w-3 h-3" />
                        </button>
                    </div>
                    
                    <div className="space-y-1">
                        <div className="text-xs uppercase font-bold text-zinc-600">Input Config</div>
                        <div className="text-sm text-zinc-400">
                            <span className="text-emerald-400/80">[{entry.personaName}]</span> {entry.input || "(No text prompt)"}
                        </div>
                        
                        {/* Image Thumbnail in History */}
                        {entry.image && (
                             <div className="mt-2">
                                <div className="inline-block relative group">
                                    <img 
                                        src={entry.image} 
                                        alt="Prompt Attachment" 
                                        className="h-12 w-auto rounded border border-zinc-700/50 object-cover"
                                    />
                                    <div className="absolute bottom-0 right-0 bg-black/60 text-[8px] px-1 text-white rounded-tl">IMG</div>
                                </div>
                             </div>
                        )}

                        {entry.styles.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                                {entry.styles.map((s, i) => (
                                    <span key={i} className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 rounded">{s}</span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="pt-3 border-t border-zinc-800/50">
                        <div className="text-xs uppercase font-bold text-zinc-600 mb-1">Result</div>
                        <div className="text-sm text-zinc-300 font-mono whitespace-pre-wrap bg-black/20 p-2 rounded border border-zinc-800/50">
                            {entry.response}
                        </div>
                        <div className="flex justify-end mt-2">
                            <HistoryCopyButton text={entry.response} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
        </div>
    );
});
