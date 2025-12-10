
import React, { useRef, useEffect } from 'react';
import { Message } from '../../types';

interface ChatInterfaceProps {
    messages: Message[];
    isThinking: boolean;
    onSendMessage: (text: string) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, isThinking, onSendMessage }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isThinking]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const val = e.currentTarget.value;
            if (val.trim()) {
                onSendMessage(val);
                e.currentTarget.value = '';
            }
        }
    };

    return (
        <div className="flex-1 flex flex-col pt-12 relative">
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full opacity-50">
                        <span className="material-symbols-outlined text-6xl mb-4 text-slate-700">psychology</span>
                        <p className="text-sm font-light text-slate-500">"Poverty is structural dependency."</p>
                        <p className="text-xs text-slate-600 mt-2">ZIA OS Initialized. Waiting for Directive...</p>
                    </div>
                )}
                {messages.map(msg => (
                    <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fade-in`}>
                        <div className={`max-w-2xl p-4 rounded-2xl ${msg.role === 'user' ? 'bg-cyan-900/10 border border-cyan-800/30 text-cyan-100' : 'bg-slate-900 border border-slate-800 text-slate-300'}`}>
                            <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</div>
                        </div>
                    </div>
                ))}
                {isThinking && <div className="flex items-center space-x-2 text-xs text-cyan-500 animate-pulse pl-2"><span className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></span><span>Processing...</span></div>}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-900">
                <div className="max-w-4xl mx-auto relative">
                    <input
                        ref={inputRef}
                        className="w-full bg-slate-900 text-slate-200 rounded-xl pl-4 pr-12 py-3 text-sm focus:ring-1 focus:ring-cyan-500/50 border border-slate-800 font-mono"
                        placeholder="Enter Directive..."
                        onKeyDown={handleKeyDown}
                    />
                    <button 
                        onClick={() => { if(inputRef.current?.value) { onSendMessage(inputRef.current.value); inputRef.current.value=''; } }}
                        className="absolute right-2 top-2 p-1 text-slate-500 hover:text-cyan-400"
                    >
                        <span className="material-symbols-outlined">send</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
