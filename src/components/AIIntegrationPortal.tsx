import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
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
                const activeKey = config.geminiKey || process.env.VITE_GEMINI_API_KEY || process.env.VITE_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY;
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

    return (
        <Card className="mt-8 border-l-4 border-l-primary/60 bg-gradient-to-r from-primary/5 to-surface">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border/80 pb-4 mb-6" id="ai-portal-header">
                <div>
                    <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
                        <svg className="w-6 h-6 text-primary animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                        AI Integration Portal
                    </h2>
                    <p className="text-text-secondary text-sm mt-1">
                        Supply your own custom API keys to power materials suggestion, tool calculations, and custom processes. Saved locally in your browser workspace! No shared quotas or shared bills.
                    </p>
                </div>
                <div className="mt-4 md:mt-0">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${savedNotice ? 'bg-green-100/80 text-green-800' : 'bg-slate-100 dark:bg-slate-800 text-text-secondary'}`} id="ai-portal-save-badge">
                        {savedNotice ? 'Saved Changes!' : 'Auto-saves Locally'}
                    </span>
                </div>
            </div>

            {/* Provider Picker Tab */}
            <div className="mb-6" id="ai-provider-picker">
                <label className="block text-sm font-bold text-text-primary mb-2">Active AI Service Engine</label>
                <div className="grid grid-cols-3 gap-3">
                    <button
                        type="button"
                        id="btn-provider-gemini"
                        onClick={() => handleChange('provider', 'gemini')}
                        className={`flex flex-col items-center justify-center p-3.5 border rounded-lg transition-all duration-200 text-center ${
                            config.provider === 'gemini'
                                ? 'border-green-500 bg-green-500/10 text-green-700 dark:text-green-400 font-bold shadow-[0_0_12px_rgba(34,197,94,0.15)]'
                                : 'border-border hover:border-text-muted hover:bg-background text-text-secondary'
                        }`}
                    >
                        <span className="text-xl">💚</span>
                        <span className="text-xs mt-1.5">Google Gemini</span>
                    </button>

                    <button
                        type="button"
                        id="btn-provider-openai"
                        onClick={() => handleChange('provider', 'openai')}
                        className={`flex flex-col items-center justify-center p-3.5 border rounded-lg transition-all duration-200 text-center ${
                            config.provider === 'openai'
                                ? 'border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-400 font-bold shadow-[0_0_12px_rgba(59,130,246,0.15)]'
                                : 'border-border hover:border-text-muted hover:bg-background text-text-secondary'
                        }`}
                    >
                        <span className="text-xl">💙</span>
                        <span className="text-xs mt-1.5">OpenAI ChatGPT</span>
                    </button>

                    <button
                        type="button"
                        id="btn-provider-anthropic"
                        onClick={() => handleChange('provider', 'anthropic')}
                        className={`flex flex-col items-center justify-center p-3.5 border rounded-lg transition-all duration-200 text-center ${
                            config.provider === 'anthropic'
                                ? 'border-purple-500 bg-purple-500/10 text-purple-700 dark:text-purple-400 font-bold shadow-[0_0_12px_rgba(168,85,247,0.15)]'
                                : 'border-border hover:border-text-muted hover:bg-background text-text-secondary'
                        }`}
                    >
                        <span className="text-xl">💜</span>
                        <span className="text-xs mt-1.5">Claude (Anthropic)</span>
                    </button>
                </div>
            </div>

            {/* Keys Inputs Grid */}
            <div className="space-y-6" id="ai-key-configurations">
                {/* 1. Gemini Config */}
                <div className={`p-4 rounded-lg border transition-all ${config.provider === 'gemini' ? 'border-green-500 bg-green-50/5' : 'border-border'}`} id="gemini-setup-card">
                    <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">💚</span>
                            <span className="font-bold text-text-primary text-sm">Google Gemini Setup</span>
                        </div>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${config.geminiKey ? 'bg-green-100 text-green-800 animate-pulse' : 'bg-slate-100 text-slate-500'}`}>
                            {config.geminiKey ? 'Configured' : 'Missing Key'}
                        </span>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        <div>
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
                            <div className="mt-1.5 flex justify-between items-center text-[11px] text-text-muted">
                                <span>
                                    {config.geminiKey 
                                        ? "🔒 Saved & secured. Click input to enter new key." 
                                        : "Obtain key from Google AI Studio."}
                                </span>
                                {config.geminiKey && (
                                    confirmDeleteId === 'gemini' ? (
                                        <span className="flex gap-2">
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
                                                className="text-red-600 hover:text-red-800 font-bold hover:underline cursor-pointer"
                                            >
                                                Confirm?
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setConfirmDeleteId(null)}
                                                className="text-text-secondary hover:text-text-primary hover:underline cursor-pointer"
                                            >
                                                Cancel
                                            </button>
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setConfirmDeleteId('gemini')}
                                            className="text-red-500 hover:text-red-700 font-bold hover:underline cursor-pointer"
                                        >
                                            Delete Key
                                        </button>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => handleTestConnection('gemini')}
                            disabled={testingProvider !== null}
                            className="text-xs"
                        >
                            {testingProvider === 'gemini' ? 'Testing...' : '⚡ Test Gemini Link'}
                        </Button>
                    </div>
                </div>

                {/* 2. OpenAI Config */}
                <div className={`p-4 rounded-lg border transition-all ${config.provider === 'openai' ? 'border-blue-500 bg-blue-50/5' : 'border-border'}`} id="openai-setup-card">
                    <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">💙</span>
                            <span className="font-bold text-text-primary text-sm">OpenAI ChatGPT Setup</span>
                        </div>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${config.openaiKey ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-500'}`}>
                            {config.openaiKey ? 'Configured' : 'Missing Key'}
                        </span>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        <div>
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
                            <div className="mt-1.5 flex justify-between items-center text-[11px] text-text-muted">
                                <span>
                                    {config.openaiKey 
                                        ? "🔒 Saved & secured. Click input to enter new key." 
                                        : "Obtain key from OpenAI developer platform."}
                                </span>
                                {config.openaiKey && (
                                    confirmDeleteId === 'openai' ? (
                                        <span className="flex gap-2">
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
                                                className="text-red-600 hover:text-red-800 font-bold hover:underline cursor-pointer"
                                            >
                                                Confirm?
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setConfirmDeleteId(null)}
                                                className="text-text-secondary hover:text-text-primary hover:underline cursor-pointer"
                                            >
                                                Cancel
                                            </button>
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setConfirmDeleteId('openai')}
                                            className="text-red-500 hover:text-red-700 font-bold hover:underline cursor-pointer"
                                        >
                                            Delete Key
                                        </button>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => handleTestConnection('openai')}
                            disabled={testingProvider !== null}
                            className="text-xs"
                        >
                            {testingProvider === 'openai' ? 'Testing...' : '⚡ Test OpenAI Link'}
                        </Button>
                    </div>
                </div>

                {/* 3. Anthropic Config */}
                <div className={`p-4 rounded-lg border transition-all ${config.provider === 'anthropic' ? 'border-purple-500 bg-purple-50/5' : 'border-border'}`} id="anthropic-setup-card">
                    <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">💜</span>
                            <span className="font-bold text-text-primary text-sm">Anthropic Claude Setup</span>
                        </div>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${config.anthropicKey ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-500'}`}>
                            {config.anthropicKey ? 'Configured' : 'Missing Key'}
                        </span>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        <div>
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
                            <div className="mt-1.5 flex justify-between items-center text-[11px] text-text-muted">
                                <span>
                                    {config.anthropicKey 
                                        ? "🔒 Saved & secured. Click input to enter new key." 
                                        : "Obtain key from Anthropic Console."}
                                </span>
                                {config.anthropicKey && (
                                    confirmDeleteId === 'anthropic' ? (
                                        <span className="flex gap-2">
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
                                                className="text-red-600 hover:text-red-800 font-bold hover:underline cursor-pointer"
                                            >
                                                Confirm?
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setConfirmDeleteId(null)}
                                                className="text-text-secondary hover:text-text-primary hover:underline cursor-pointer"
                                            >
                                                Cancel
                                            </button>
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setConfirmDeleteId('anthropic')}
                                            className="text-red-500 hover:text-red-700 font-bold hover:underline cursor-pointer"
                                        >
                                            Delete Key
                                        </button>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => handleTestConnection('anthropic')}
                            disabled={testingProvider !== null}
                            className="text-xs"
                        >
                            {testingProvider === 'anthropic' ? 'Testing...' : '⚡ Test Anthropic Link'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Test Connection Display Panel */}
            {testResult && (
                <div id="ai-test-connection-result" className={`mt-6 p-4 rounded-md text-sm border flex items-start gap-2.5 transition-all animate-fade-in ${
                    testResult.success
                        ? 'bg-green-100/90 border-green-200 text-green-800'
                        : 'bg-red-100/90 border-red-200 text-red-800'
                }`}>
                    <span className="text-lg">{testResult.success ? '🚀' : '⚠️'}</span>
                    <div>
                        <span className="font-bold block">{testResult.success ? 'Success!' : 'Configuration Error'}</span>
                        <p className="text-xs mt-0.5 font-mono">{testResult.message}</p>
                    </div>
                </div>
            )}
        </Card>
    );
};
