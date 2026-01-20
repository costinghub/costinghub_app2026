
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, History, Trash2, ChevronLeft, Calendar } from 'lucide-react';
import { sendChatMessage } from '../services/geminiService';
import { DataService, AuthService } from '../services/supabaseService';
import { ChatMessage } from '../types';

export const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'chat' | 'history'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const user = AuthService.getCurrentUser();

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;
    setIsSyncing(true);
    try {
      const history = await DataService.getChatHistory(user.id);
      if (history.length > 0) {
        setMessages(history);
      } else {
        setMessages([
          { id: '1', role: 'model', text: 'Hello! I am your CostingHub AI assistant. Ask me about MHR, material costs, or foundry processes.', timestamp: new Date() }
        ]);
      }
    } catch (error) {
      console.error("Failed to load chat history:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleChat = () => setIsOpen(!isOpen);

  useEffect(() => {
    if (messagesEndRef.current && view === 'chat') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, view]);

  const handleSend = async () => {
    if (!input.trim() || !user) return;
    
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    await DataService.saveChatMessage(userMsg, user.id);

    const history = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    const responseText = await sendChatMessage(history, userMsg.text);
    
    const botMsg: ChatMessage = { 
      id: `m-${Date.now() + 1}`, 
      role: 'model', 
      text: responseText || "Sorry, I couldn't process that.", 
      timestamp: new Date() 
    };

    setMessages(prev => [...prev, botMsg]);
    await DataService.saveChatMessage(botMsg, user.id);
    setIsLoading(false);
  };

  const handleClearHistory = async () => {
    if (!user) return;
    if (window.confirm("Are you sure you want to clear your entire chat history?")) {
      await DataService.clearChatHistory(user.id);
      setMessages([
        { id: '1', role: 'model', text: 'History cleared. How can I help you today?', timestamp: new Date() }
      ]);
      setView('chat');
    }
  };

  const groupedHistory = messages.reduce((acc: Record<string, ChatMessage[]>, msg) => {
    const date = msg.timestamp.toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(msg);
    return acc;
  }, {});

  return (
    <>
      {!isOpen && (
        <button 
          onClick={toggleChat}
          className="fixed bottom-6 right-6 bg-primary-600 hover:bg-primary-700 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-110 z-50 flex items-center gap-2"
        >
          <Bot className="w-6 h-6" />
          <span className="font-semibold hidden sm:inline">AI Expert</span>
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white dark:bg-slate-800 rounded-xl shadow-2xl flex flex-col z-50 border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div className="p-4 bg-primary-600 text-white flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              {view === 'history' ? (
                <button onClick={() => setView('chat')} className="p-1 hover:bg-white/20 rounded">
                  <ChevronLeft className="w-5 h-5" />
                </button>
              ) : (
                <Bot className="w-5 h-5" />
              )}
              <h3 className="font-bold">{view === 'chat' ? 'CostingHub AI' : 'Conversation History'}</h3>
            </div>
            <div className="flex items-center gap-1">
              {view === 'chat' ? (
                <button 
                  onClick={() => setView('history')} 
                  title="View History"
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <History className="w-4 h-4" />
                </button>
              ) : (
                <button 
                  onClick={handleClearHistory} 
                  title="Clear All History"
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-red-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button onClick={toggleChat} className="p-1.5 hover:bg-white/20 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-900 custom-scrollbar">
            {isSyncing && messages.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-xs font-medium">Syncing history...</span>
               </div>
            ) : view === 'chat' ? (
              <div className="p-4 space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] group`}>
                      <div className={`p-3 rounded-2xl text-sm shadow-sm ${
                        msg.role === 'user' 
                          ? 'bg-primary-600 text-white rounded-br-none' 
                          : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-gray-200 rounded-bl-none'
                      }`}>
                        {msg.text}
                      </div>
                      <div className={`text-[10px] mt-1 text-slate-400 font-medium ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-bl-none shadow-sm border border-gray-200 dark:border-slate-700">
                      <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <div className="p-4 space-y-6">
                {Object.entries(groupedHistory).length === 0 ? (
                  <div className="text-center py-20 text-slate-400">
                     <History className="w-12 h-12 mx-auto mb-2 opacity-20" />
                     <p>No past conversations found.</p>
                  </div>
                ) : (
                  Object.entries(groupedHistory).reverse().map(([date, msgs]) => (
                    <div key={date} className="space-y-2">
                       <div className="flex items-center gap-2 px-2">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{date}</span>
                          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800"></div>
                       </div>
                       <div className="space-y-1">
                          {(msgs as ChatMessage[]).filter(m => m.role === 'user').map(m => (
                            <button 
                              key={m.id}
                              onClick={() => setView('chat')}
                              className="w-full text-left p-3 rounded-xl hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm border border-transparent hover:border-gray-200 dark:hover:border-slate-700 transition-all group"
                            >
                               <div className="text-xs font-bold text-slate-700 dark:text-slate-300 line-clamp-1 group-hover:text-primary-600">{m.text}</div>
                               <div className="text-[10px] text-slate-400 mt-0.5">{m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            </button>
                          ))}
                       </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {view === 'chat' && (
            <div className="p-3 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask about costs..."
                  className="flex-1 px-4 py-2 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
                <button 
                  onClick={handleSend} 
                  disabled={isLoading || !input.trim()}
                  className="bg-primary-600 text-white p-2.5 rounded-full hover:bg-primary-700 disabled:opacity-50 transition-colors shadow-md shadow-primary-500/20"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};
