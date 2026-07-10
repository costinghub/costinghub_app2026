import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { getAIConfig, saveAIConfig, DEFAULT_AI_CONFIG, type AIProviderConfig } from '../services/aiConfig';

export const AIIntegrationPortal: React.FC = () => {
    const [config, setConfig] = useState<AIProviderConfig>(DEFAULT_AI_CONFIG);
    const [geminiKeyInput, setGeminiKeyInput] = useState('');
    const [openaiKeyInput, setOpenaiKeyInput] = useState('');
    const [anthropicKeyInput, setAnthropicKeyInput] = useState('');
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [testingProvider, setTestingProvider] = useState<string | null>(null);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [savedNotice, setSavedNotice] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(true);

    useEffect(() => {
        const loaded = getAIConfig();
        setConfig(loaded);
        setGeminiKeyInput(loaded.geminiKey ? '••••••••••••••••' : '');
        setOpenaiKeyInput(loaded.openaiKey ? '••••••••••••••••' : '');
        setAnthropicKeyInput(loaded.anthropicKey ? '••••••••••••••••' : '');
    }, []);

    const handleChange = (field: keyof AIProviderConfig, value: string) => {
        const updated = { ...config, [field]: value };
        setConfig(updated);
        saveAIConfig(updated);
        setSavedNotice(true);
        setTimeout(() => setSavedNotice(false), 2000);
        setTestResult(null); // Clear old results when switching engines
    };

    const handleKeyChange = (provider: 'gemini' | 'openai' | 'anthropic', value: string) => {
        if (provider === 'gemini') {
            setGeminiKeyInput(value);
            if (value !== '••••••••••••••••') {
                const updated = { ...config, geminiKey: value };
                setConfig(updated);
                saveAIConfig(updated);
                setSavedNotice(true);
                setTimeout(() => setSavedNotice(false), 2000);
            }
        } else if (provider === 'openai') {
            setOpenaiKeyInput(value);
            if (value !== '••••••••••••••••') {
                const updated = { ...config, openaiKey: value };
                setConfig(updated);
                saveAIConfig(updated);
                setSavedNotice(true);
                setTimeout(() => setSavedNotice(false), 2000);
            }
        } else if (provider === 'anthropic') {
            setAnthropicKeyInput(value);
            if (value !== '••••••••••••••••') {
                const updated = { ...config, anthropicKey: value };
                setConfig(updated);
                saveAIConfig(updated);
                setSavedNotice(true);
                setTimeout(() => setSavedNotice(false), 2000);
            }
        }
    };

    const handleKeyFocus = (provider: 'gemini' | 'openai' | 'anthropic') => {
        if (provider === 'gemini' && geminiKeyInput === '••••••••••••••••') {
            setGeminiKeyInput('');
        } else if (provider === 'openai' && openaiKeyInput === '••••••••••••••••') {
            setOpenaiKeyInput('');
        } else if (provider === 'anthropic' && anthropicKeyInput === '••••••••••••••••') {
            setAnthropicKeyInput('');
        }
    };

    const handleKeyBlur = (provider: 'gemini' | 'openai' | 'anthropic') => {
        if (provider === 'gemini' && !geminiKeyInput && config.geminiKey) {
            setGeminiKeyInput('••••••••••••••••');
        } else if (provider === 'openai' && !openaiKeyInput && config.openaiKey) {
            setOpenaiKeyInput('••••••••••••••••');
        } else if (provider === 'anthropic' && !anthropicKeyInput && config.anthropicKey) {
            setAnthropicKeyInput('••••••••••••••••');
        }
    };

    const handleTestConnection = async (provider: 'gemini' | 'openai' | 'anthropic') => {
        setTestingProvider(provider);
        setTestResult(null);

        try {
            let apiEndpoint = '';
            let requestBody: any = {};
            const requestHeaders: any = { 'Content-Type': 'application/json' };

            if (provider === 'gemini') {
                const activeKey = config.geminiKey;
                if (!activeKey) {
                    throw new Error("Missing Gemini API Key. Please insert your key before testing.");
                }
                apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${config.geminiModel || 'gemini-1.5-flash'}:generateContent?key=${activeKey}`;
                requestBody = {
                    contents: [{ parts: [{ text: "Respond with exactly the text 'Connection Successful!'" }] }]
                };
            } else if (provider === 'openai') {
                if (!config.openaiKey) {
                    throw new Error("Missing OpenAI API Key. Please insert your key before testing.");
                }
                apiEndpoint = "https://api.openai.com/v1/chat/completions";
                requestHeaders['Authorization'] = `Bearer ${config.openaiKey}`;
                requestBody = {
                    model: config.openaiModel || 'gpt-4o-mini',
                    messages: [{ role: 'user', content: "Respond with exactly 'Connection Successful!'" }],
                    max_tokens: 15
                };
            } else if (provider === 'anthropic') {
                if (!config.anthropicKey) {
                    throw new Error("Missing Anthropic API Key. Please insert your key before testing.");
                }
                apiEndpoint = "/api/ai/anthropic-proxy";
                requestHeaders['x-user-api-key'] = config.anthropicKey;
                requestBody = {
                    model: config.anthropicModel || 'claude-3-5-sonnet-latest',
                    prompt: "Respond with exactly 'Connection Successful!'",
                    system: "Please write a concise success remark."
                };
            }

            const res = await fetch(apiEndpoint, {
                method: 'POST',
                headers: requestHeaders,
                body: JSON.stringify(requestBody)
            });

            if (!res.ok) {
                const errJson = await res.json().catch(() => ({}));
                throw new Error(errJson.error?.message || errJson.error || `HTTP error ${res.status}`);
            }

            setTestResult({
                success: true,
                message: `Perfect! Connection verified successfully with ${provider.toUpperCase()}.`
            });
        } catch (e: any) {
            setTestResult({
                success: false,
                message: e.message || "Failed to verify. Please inspect your key and network connection."
            });
        } finally {
            setTestingProvider(null);
        }
    };

    const getProviderLabel = (p: 'gemini' | 'openai' | 'anthropic') => {
        if (p === 'gemini') return 'Google Gemini';
        if (p === 'openai') return 'OpenAI ChatGPT';
        return 'Claude (Anthropic)';
    };

    const isCurrentKeyConfigured = () => {
        if (config.provider === 'gemini') return !!config.geminiKey;
        if (config.provider === 'openai') return !!config.openaiKey;
        return !!config.anthropicKey;
    };

    return (
        <Card className="mt-8 border-l-4 border-l-primary/60 bg-gradient-to-r from-primary/5 to-surface overflow-hidden transition-all duration-300">
            {/* Clickable Header for Collapsing */}
            <div 
                className="flex items-center justify-between p-5 cursor-pointer hover:bg-primary/5 transition-all select-none"
                onClick={() => setIsCollapsed(!isCollapsed)}
                id="ai-portal-header"
            >
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <div className="p-2.5 bg-primary/10 rounded-xl text-primary shrink-0">
                        <svg className={`w-5 h-5 text-primary transition-transform duration-300 ${isCollapsed ? 'animate-pulse scale-100' : 'rotate-12 scale-110'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-lg font-extrabold text-primary flex items-center gap-2">
                            AI Service Engine &amp; API Integration
                        </h2>
                        <p className="text-text-secondary text-xs mt-0.5 font-medium truncate max-w-xl">
                            {isCollapsed 
                                ? `Active Provider: ${getProviderLabel(config.provider)} (${isCurrentKeyConfigured() ? 'Connected ⚡' : 'Setup needed ⚠️'}). Click to expand.`
                                : "Supply custom API keys to power intelligent process analyser and material recommendations."
                            }
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3 shrink-0 ml-4">
                    <span className={`text-[10px] tracking-widest font-black uppercase px-2.5 py-1 rounded-full hidden sm:inline-block ${savedNotice ? 'bg-green-500/10 text-green-600' : 'bg-background/80 text-text-secondary border border-border'}`}>
                        {savedNotice ? 'Saved!' : 'Auto-saves'}
                    </span>
                    <div className="p-1 rounded-lg hover:bg-background/80 transition-colors">
                        <svg 
                            className={`w-5 h-5 text-text-secondary transition-transform duration-300 ${isCollapsed ? 'rotate-0' : 'rotate-180'}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Collapsible Content */}
            {!isCollapsed && (
                <div className="p-6 pt-2 border-t border-border/40 bg-background/30 animate-fade-in" id="ai-portal-body">
                    <p className="text-text-secondary text-xs leading-relaxed mb-5 font-medium">
                        Your keys are kept strictly private and saved securely in your browser's local sandbox environment. They are never sent to external servers other than direct LLM service requests.
                    </p>

                    {/* Engine Dropdown Menu Selector */}
                    <div className="mb-6" id="ai-provider-picker">
                        <label className="block text-xs font-black uppercase tracking-wider text-text-secondary mb-2">
                            Active AI Service Engine
                        </label>
                        <div className="relative">
                            <select
                                id="select-ai-engine"
                                value={config.provider}
                                onChange={(e) => handleChange('provider', e.target.value as 'gemini' | 'openai' | 'anthropic')}
                                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-hidden focus:ring-2 focus:ring-primary/40 focus:border-primary appearance-none cursor-pointer pr-10 font-bold"
                            >
                                <option value="gemini">💚 Google Gemini (Recommended - 2.5 Flash)</option>
                                <option value="openai">💙 OpenAI ChatGPT (gpt-4o-mini)</option>
                                <option value="anthropic">💜 Claude (Anthropic - 3.5 Sonnet)</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-text-secondary">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Active Configuration Input & Test Connection Area */}
                    <div id="ai-key-configurations" className="space-y-4">
                        {config.provider === 'gemini' && (
                            <div className="p-4 rounded-xl border border-green-500/20 bg-green-500/5 transition-all" id="gemini-setup-card">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-base">💚</span>
                                        <span className="font-extrabold text-text-primary text-sm">Google Gemini Setup</span>
                                    </div>
                                    <span className={`text-[9px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-full ${config.geminiKey ? 'bg-green-500/10 text-green-600' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                                        {config.geminiKey ? 'Configured' : 'Missing Key'}
                                    </span>
                                </div>
                                
                                <div className="space-y-4">
                                    <Input
                                        label="Gemini API Key"
                                        id="gemini-api-key-input"
                                        type="password"
                                        placeholder={config.geminiKey ? "••••••••••••••••" : "Paste your Gemini API key..."}
                                        value={geminiKeyInput}
                                        onChange={(e) => handleKeyChange('gemini', e.target.value)}
                                        onFocus={() => handleKeyFocus('gemini')}
                                        onBlur={() => handleKeyBlur('gemini')}
                                    />
                                    
                                    <div className="flex justify-between items-center text-xs text-text-muted mt-1 font-medium">
                                        <span>
                                            {config.geminiKey 
                                                ? "🔒 Key saved locally. Click input to enter new key." 
                                                : "Create free keys in Google AI Studio."}
                                        </span>
                                        {config.geminiKey && (
                                            confirmDeleteId === 'gemini' ? (
                                                <span className="flex gap-2.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setGeminiKeyInput('');
                                                            const updated = { ...config, geminiKey: '' };
                                                            setConfig(updated);
                                                            saveAIConfig(updated);
                                                            setConfirmDeleteId(null);
                                                            setSavedNotice(true);
                                                            setTimeout(() => setSavedNotice(false), 2000);
                                                        }}
                                                        className="text-red-500 hover:text-red-600 font-extrabold cursor-pointer hover:underline"
                                                    >
                                                        Confirm
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setConfirmDeleteId(null)}
                                                        className="text-text-secondary hover:text-text-primary font-bold cursor-pointer hover:underline"
                                                    >
                                                        Cancel
                                                    </button>
                                                </span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => setConfirmDeleteId('gemini')}
                                                    className="text-red-500 hover:text-red-600 font-bold cursor-pointer hover:underline"
                                                >
                                                    Delete Key
                                                </button>
                                            )
                                        )}
                                    </div>
                                    
                                    <div className="flex justify-end pt-2">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={() => handleTestConnection('gemini')}
                                            disabled={testingProvider !== null}
                                            className="text-xs font-extrabold uppercase tracking-wider bg-green-500/10 hover:bg-green-500/20 text-green-600 border border-green-500/20"
                                        >
                                            {testingProvider === 'gemini' ? 'Verifying...' : '⚡ Test Gemini connection'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {config.provider === 'openai' && (
                            <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 transition-all" id="openai-setup-card">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-base">💙</span>
                                        <span className="font-extrabold text-text-primary text-sm">OpenAI ChatGPT Setup</span>
                                    </div>
                                    <span className={`text-[9px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-full ${config.openaiKey ? 'bg-blue-500/10 text-blue-600' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                                        {config.openaiKey ? 'Configured' : 'Missing Key'}
                                    </span>
                                </div>
                                
                                <div className="space-y-4">
                                    <Input
                                        label="OpenAI API Key"
                                        id="openai-api-key-input"
                                        type="password"
                                        placeholder={config.openaiKey ? "••••••••••••••••" : "sk-..."}
                                        value={openaiKeyInput}
                                        onChange={(e) => handleKeyChange('openai', e.target.value)}
                                        onFocus={() => handleKeyFocus('openai')}
                                        onBlur={() => handleKeyBlur('openai')}
                                    />
                                    
                                    <div className="flex justify-between items-center text-xs text-text-muted mt-1 font-medium">
                                        <span>
                                            {config.openaiKey 
                                                ? "🔒 Key saved locally. Click input to enter new key." 
                                                : "Generate keys in OpenAI developer space."}
                                        </span>
                                        {config.openaiKey && (
                                            confirmDeleteId === 'openai' ? (
                                                <span className="flex gap-2.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setOpenaiKeyInput('');
                                                            const updated = { ...config, openaiKey: '' };
                                                            setConfig(updated);
                                                            saveAIConfig(updated);
                                                            setConfirmDeleteId(null);
                                                            setSavedNotice(true);
                                                            setTimeout(() => setSavedNotice(false), 2000);
                                                        }}
                                                        className="text-red-500 hover:text-red-600 font-extrabold cursor-pointer hover:underline"
                                                    >
                                                        Confirm
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setConfirmDeleteId(null)}
                                                        className="text-text-secondary hover:text-text-primary font-bold cursor-pointer hover:underline"
                                                    >
                                                        Cancel
                                                    </button>
                                                </span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => setConfirmDeleteId('openai')}
                                                    className="text-red-500 hover:text-red-600 font-bold cursor-pointer hover:underline"
                                                >
                                                    Delete Key
                                                </button>
                                            )
                                        )}
                                    </div>
                                    
                                    <div className="flex justify-end pt-2">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={() => handleTestConnection('openai')}
                                            disabled={testingProvider !== null}
                                            className="text-xs font-extrabold uppercase tracking-wider bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 border border-blue-500/20"
                                        >
                                            {testingProvider === 'openai' ? 'Verifying...' : '⚡ Test OpenAI connection'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {config.provider === 'anthropic' && (
                            <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 transition-all" id="anthropic-setup-card">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-base">💜</span>
                                        <span className="font-extrabold text-text-primary text-sm">Anthropic Claude Setup</span>
                                    </div>
                                    <span className={`text-[9px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-full ${config.anthropicKey ? 'bg-purple-500/10 text-purple-600' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                                        {config.anthropicKey ? 'Configured' : 'Missing Key'}
                                    </span>
                                </div>
                                
                                <div className="space-y-4">
                                    <Input
                                        label="Claude API Key"
                                        id="anthropic-api-key-input"
                                        type="password"
                                        placeholder={config.anthropicKey ? "••••••••••••••••" : "sk-ant-..."}
                                        value={anthropicKeyInput}
                                        onChange={(e) => handleKeyChange('anthropic', e.target.value)}
                                        onFocus={() => handleKeyFocus('anthropic')}
                                        onBlur={() => handleKeyBlur('anthropic')}
                                    />
                                    
                                    <div className="flex justify-between items-center text-xs text-text-muted mt-1 font-medium">
                                        <span>
                                            {config.anthropicKey 
                                                ? "🔒 Key saved locally. Click to enter new key." 
                                                : "Generate keys in Anthropic Console."}
                                        </span>
                                        {config.anthropicKey && (
                                            confirmDeleteId === 'anthropic' ? (
                                                <span className="flex gap-2.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setAnthropicKeyInput('');
                                                            const updated = { ...config, anthropicKey: '' };
                                                            setConfig(updated);
                                                            saveAIConfig(updated);
                                                            setConfirmDeleteId(null);
                                                            setSavedNotice(true);
                                                            setTimeout(() => setSavedNotice(false), 2000);
                                                        }}
                                                        className="text-red-500 hover:text-red-600 font-extrabold cursor-pointer hover:underline"
                                                    >
                                                        Confirm
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setConfirmDeleteId(null)}
                                                        className="text-text-secondary hover:text-text-primary font-bold cursor-pointer hover:underline"
                                                    >
                                                        Cancel
                                                    </button>
                                                </span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => setConfirmDeleteId('anthropic')}
                                                    className="text-red-500 hover:text-red-600 font-bold cursor-pointer hover:underline"
                                                >
                                                    Delete Key
                                                </button>
                                            )
                                        )}
                                    </div>
                                    
                                    <div className="flex justify-end pt-2">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={() => handleTestConnection('anthropic')}
                                            disabled={testingProvider !== null}
                                            className="text-xs font-extrabold uppercase tracking-wider bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 border border-purple-500/20"
                                        >
                                            {testingProvider === 'anthropic' ? 'Verifying...' : '⚡ Test Anthropic connection'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Test Connection Display Panel */}
                    {testResult && (
                        <div id="ai-test-connection-result" className={`mt-5 p-4 rounded-xl text-sm border flex items-start gap-3 transition-all animate-fade-in ${
                            testResult.success
                                ? 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400 font-medium'
                                : 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400 font-medium'
                        }`}>
                            <span className="text-base shrink-0">{testResult.success ? '🚀' : '⚠️'}</span>
                            <div className="min-w-0">
                                <span className="font-extrabold block text-xs uppercase tracking-wider">{testResult.success ? 'Test Successful' : 'Configuration Error'}</span>
                                <p className="text-xs mt-1 font-mono break-all leading-relaxed bg-background/50 p-2 rounded-lg border border-border/30">{testResult.message}</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
};
