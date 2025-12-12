
import React, { useRef, useEffect, useState } from 'react';
import { Message } from '../../types';

interface ChatInterfaceProps {
    messages: Message[];
    isThinking: boolean;
    onSendMessage: (text: string, attachment?: { mimeType: string; data: string }) => void;
    isMuted?: boolean;
    onToggleMute?: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, isThinking, onSendMessage, isMuted, onToggleMute }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [attachment, setAttachment] = useState<{ mimeType: string; data: string; preview: string } | null>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isThinking, attachment]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const val = e.currentTarget.value;
            if (val.trim() || attachment) {
                onSendMessage(val, attachment ? { mimeType: attachment.mimeType, data: attachment.data } : undefined);
                e.currentTarget.value = '';
                setAttachment(null);
            }
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            // Remove data URL prefix for API (keep it for preview)
            const base64Data = base64String.split(',')[1];
            setAttachment({
                mimeType: file.type,
                data: base64Data,
                preview: base64String
            });
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="flex-1 flex flex-col pt-12 relative">
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full opacity-50">
                        <span className="material-symbols-outlined text-6xl mb-4 text-slate-700">psychology</span>
                        <p className="text-sm font-light text-slate-500">"Poverty is structural dependency."</p>
                        <p className="text-xs text-slate-600 mt-2">ZIA OS v10.3 (Voice Active)</p>
                    </div>
                )}
                {messages.map(msg => (
                    <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fade-in`}>
                        <div className={`max-w-2xl p-4 rounded-2xl ${msg.role === 'user' ? 'bg-cyan-900/10 border border-cyan-800/30 text-cyan-100' : 'bg-slate-900 border border-slate-800 text-slate-300'}`}>
                            {msg.metadata?.harvested && ( // Check for image metadata if we store it later
                                <div className="mb-2 text-xs text-slate-500 flex items-center">
                                    <span className="material-symbols-outlined text-sm mr-1">image</span> Image Analysis
                                </div>
                            )}
                            <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</div>
                        </div>
                    </div>
                ))}
                {isThinking && <div className="flex items-center space-x-2 text-xs text-cyan-500 animate-pulse pl-2"><span className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></span><span>Processing Visual & Logic Data...</span></div>}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-900">
                {attachment && (
                    <div className="mb-2 flex items-center bg-slate-900/80 p-2 rounded border border-slate-700 w-fit">
                        <img src={attachment.preview} alt="Preview" className="h-10 w-10 object-cover rounded mr-2" />
                        <span className="text-[10px] text-slate-300 mr-2">Image Attached</span>
                        <button onClick={() => setAttachment(null)} className="text-slate-500 hover:text-red-400">
                            <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                    </div>
                )}
                <div className="max-w-4xl mx-auto relative flex items-center space-x-2">
                    {onToggleMute && (
                        <button 
                            onClick={onToggleMute}
                            className={`p-3 bg-slate-900 border border-slate-800 rounded-xl transition-colors ${isMuted ? 'text-slate-600' : 'text-cyan-400'}`}
                            title={isMuted ? "Unmute Voice" : "Mute Voice"}
                        >
                            <span className="material-symbols-outlined">{isMuted ? 'volume_off' : 'volume_up'}</span>
                        </button>
                    )}
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-500 hover:text-cyan-400 transition-colors"
                        title="Attach Image"
                    >
                        <span className="material-symbols-outlined">add_photo_alternate</span>
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handleFileSelect}
                    />
                    
                    <div className="relative flex-1">
                        <input
                            ref={inputRef}
                            className="w-full bg-slate-900 text-slate-200 rounded-xl pl-4 pr-12 py-3 text-sm focus:ring-1 focus:ring-cyan-500/50 border border-slate-800 font-mono"
                            placeholder="Enter Directive..."
                            onKeyDown={handleKeyDown}
                        />
                        <button 
                            onClick={() => { 
                                if(inputRef.current?.value || attachment) { 
                                    onSendMessage(inputRef.current?.value || "", attachment ? { mimeType: attachment.mimeType, data: attachment.data } : undefined); 
                                    if (inputRef.current) inputRef.current.value='';
                                    setAttachment(null);
                                } 
                            }}
                            className="absolute right-2 top-2 p-1 text-slate-500 hover:text-cyan-400"
                        >
                            <span className="material-symbols-outlined">send</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
