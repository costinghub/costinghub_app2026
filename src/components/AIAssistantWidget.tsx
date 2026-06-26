import React, { useState, useEffect, useRef } from 'react';
import { getAIConfig, hasAnyAIKey } from '../services/aiConfig';
import { Button } from './ui/Button';

interface ChatMessage {
    sender: 'user' | 'ai';
    text: string;
    timestamp: Date;
}

export const AIAssistantWidget: React.FC<{ onNavigate: (view: 'settings') => void }> = ({ onNavigate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        { 
            sender: 'ai', 
            text: 'Hello! I am your CostingHub Machining AI Coordinator. Ask me about machining formulas, material capabilities, cycle times, or feed parameters! (Uses your saved API Key)', 
            timestamp: new Date() 
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [hasKey, setHasKey] = useState(false);
    const [config, setConfig] = useState<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Dynamic checks for locally saved API keys
    useEffect(() => {
        const aiConfig = getAIConfig();
        setConfig(aiConfig);
        setHasKey(hasAnyAIKey(aiConfig));
    }, [isOpen]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isLoading]);

    const handleQuickPrompt = (promptText: string) => {
        setInputValue(promptText);
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const originalText = inputValue;
        const userMessage: ChatMessage = { sender: 'user', text: originalText, timestamp: new Date() };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            const currentConfig = getAIConfig();
            const provider = currentConfig.provider || 'gemini';

            let responseText = '';

            if (provider === 'gemini') {
                const apiKey = currentConfig.geminiKey || process.env.VITE_GEMINI_API_KEY || process.env.VITE_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY;
                if (!apiKey) {
                    throw new Error("No Gemini API key is configured. Go to Settings > AI Integration Portal to enter your key.");
                }
                const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${currentConfig.geminiModel || 'gemini-1.5-flash'}:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: originalText }] }]
                    })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`);
                responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response came back.';
            } 
            else if (provider === 'openai') {
                if (!currentConfig.openaiKey) {
                    throw new Error("No OpenAI API key is configured. Go to Settings > AI Integration Portal to enter your key.");
                }
                const res = await fetch("https://api.openai.com/v1/chat/completions", {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${currentConfig.openaiKey}`
                    },
                    body: JSON.stringify({
                        model: currentConfig.openaiModel || 'gpt-4o-mini',
                        messages: [
                            { role: 'system', content: 'You are a highly helpful, senior machining and cost calculation engineer assistant. Offer clear feedback, formulas, density information, or feeds advice.' },
                            { role: 'user', content: originalText }
                        ]
                    })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`);
                responseText = data.choices?.[0]?.message?.content || 'No response came back.';
            } 
            else if (provider === 'anthropic') {
                if (!currentConfig.anthropicKey) {
                    throw new Error("No Anthropic API key is configured. Go to Settings > AI Integration Portal to enter your key.");
                }
                const res = await fetch("/api/ai/anthropic-proxy", {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-user-api-key': currentConfig.anthropicKey },
                    body: JSON.stringify({
                        model: currentConfig.anthropicModel || 'claude-3-5-sonnet-latest',
                        prompt: originalText,
                        system: 'You are a helpful machining expert who helps users estimate machine settings, tool life, and rates cost. Keep formatting clean.'
                    })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
                responseText = data.content?.[0]?.text || 'No response came back.';
            }

            setMessages(prev => [...prev, { sender: 'ai', text: responseText, timestamp: new Date() }]);
        } catch (error: any) {
            setMessages(prev => [...prev, { 
                sender: 'ai', 
                text: `⚠️ Request Failed:\n${error.message || 'Make sure you added the correct API Key under User Settings.'}`, 
                timestamp: new Date() 
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end ai-assistant-widget no-print" id="helper-ai-assistant">
            {/* Expanded Drawer */}
            {isOpen && (
                <div className="w-[380px] sm:w-[420px] h-[580px] bg-surface border border-border/80 rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col mb-4 animate-fade-in text-text-primary">
                    {/* Header */}
                    <div className="px-4 py-3 bg-gradient-to-r from-primary to-primary-variant text-white flex justify-between items-center select-none">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">🤖</span>
                            <div>
                                <h3 className="font-bold text-sm leading-none">Machining AI Assistant</h3>
                                <span className="text-[10px] text-white/80 uppercase tracking-widest block mt-1">
                                    {config ? `${config.provider.toUpperCase()} ENGINE` : 'INTEGRATION'}
                                </span>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsOpen(false)} 
                            className="text-white/85 hover:text-white bg-black/10 hover:bg-black/25 p-1 rounded-full transition-colors focus:outline-none"
                            id="close-ai-panel-btn"
                        >
                            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    {/* API Key Status Guard Display */}
                    {!hasKey && (
                        <div className="bg-yellow-1000/10 border-b border-yellow-200/50 p-3 text-xs flex justify-between items-center bg-yellow-100/90 text-yellow-800">
                            <p className="flex-1 mr-2 leading-relaxed">
                                🔑 <strong>API Key Unloaded</strong>: Put your custom Google Gemini, Claude, or ChatGPT key in settings to unlock AI.
                            </p>
                            <Button 
                                variant="secondary" 
                                type="button" 
                                onClick={() => { setIsOpen(false); onNavigate('settings'); }} 
                                className="!py-1 !px-2 text-[10px] font-bold shrink-0 bg-yellow-600 hover:bg-yellow-700 text-white border-none"
                            >
                                Setup
                            </Button>
                        </div>
                    )}

                    {/* Messages Body */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/30 scrollbar-thin">
                        {messages.map((m, idx) => (
                            <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-lg p-3 text-sm leading-relaxed whitespace-pre-line shadow-xs ${
                                    m.sender === 'user' 
                                        ? 'bg-primary text-white font-medium rounded-tr-none' 
                                        : 'bg-surface border border-border/80 text-text-primary rounded-tl-none'
                                }`}>
                                    {m.text}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-surface border border-border/80 rounded-lg rounded-tl-none p-3 shadow-xs max-w-[80%]">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce"></div>
                                        <div className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce delay-150"></div>
                                        <div className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce delay-300"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Custom prompt quick links */}
                    <div className="px-3 py-2 bg-background/5 border-t border-border flex gap-1.5 overflow-x-auto select-none max-w-full">
                        <button 
                            onClick={() => handleQuickPrompt("What is the formula for cutting speed Vc in milling?")}
                            className="bg-surface border border-border hover:border-text-muted px-2.5 py-1 rounded-full text-[10px] text-text-secondary whitespace-nowrap transition"
                        >
                            📊 Cutting Speed Formula
                        </button>
                        <button 
                            onClick={() => handleQuickPrompt("Compare the density and properties of Stainless Steel 304 vs Aluminum 6061-T6.")}
                            className="bg-surface border border-border hover:border-text-muted px-2.5 py-1 rounded-full text-[10px] text-text-secondary whitespace-nowrap transition"
                        >
                            ⚙️ Steel vs Alum.
                        </button>
                        <button 
                            onClick={() => handleQuickPrompt("Write a custom JavaScript time formula for cycle estimation on sheet metal punching.")}
                            className="bg-surface border border-border hover:border-text-muted px-2.5 py-1 rounded-full text-[10px] text-text-secondary whitespace-nowrap transition"
                        >
                            📝 Write Formula
                        </button>
                    </div>

                    {/* Bottom Input Area */}
                    <form onSubmit={handleSendMessage} className="p-3 border-t border-border bg-surface flex gap-2 items-center">
                        <input
                            type="text"
                            placeholder={hasKey ? "Ask anything..." : "API key required in Settings..."}
                            disabled={!hasKey || isLoading}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            className="flex-1 bg-background/50 border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary text-text-input placeholder:text-text-muted disabled:bg-surface disabled:cursor-not-allowed"
                            id="ai-assistant-text-field"
                        />
                        <button
                            type="submit"
                            disabled={!hasKey || !inputValue.trim() || isLoading}
                            className={`p-1.5 text-white rounded-lg focus:outline-none transition-all flex items-center justify-center ${
                                hasKey && inputValue.trim() && !isLoading
                                    ? 'bg-primary hover:bg-primary-variant shadow-[0_2px_8px_rgba(var(--color-primary-rgb),0.3)] cursor-pointer'
                                    : 'bg-text-muted/40 cursor-not-allowed'
                            }`}
                            id="ai-send-btn"
                        >
                            <svg className="w-5 h-5 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                        </button>
                    </form>
                </div>
            )}

            {/* Bubble Trigger Button */}
            <button
                type="button"
                id="btn-trigger-ai-assistant"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full flex items-center justify-center text-white transition-all shadow-lg border hover:scale-105 duration-200 select-none cursor-pointer ${
                    isOpen 
                        ? 'bg-text-primary border-border/10' 
                        : 'bg-primary border-primary hover:bg-primary-variant hover:shadow-[0_8px_24px_rgba(var(--color-primary-rgb),0.4)]'
                }`}
            >
                {isOpen ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                ) : (
                    <div className="relative">
                        <span className="text-2xl">🤖</span>
                        {hasKey && (
                            <span className="absolute -top-1 -right-1 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-white border border-green-300 animate-pulse" />
                        )}
                    </div>
                )}
            </button>
        </div>
    );
};
