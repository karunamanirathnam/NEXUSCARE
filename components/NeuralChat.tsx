
import React, { useState, useRef, useEffect } from 'react';
import { MediaItem, ChatMessage, User } from '../types';
import { chatWithMedia } from '../services/geminiService';

interface NeuralChatProps {
  item: MediaItem;
  user: User;
  onUpdateChat: (newMessages: ChatMessage[]) => void;
}

const NeuralChat: React.FC<NeuralChatProps> = ({ item, user, onUpdateChat }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [item.chatHistory]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      sender: user.username,
      text: input,
      timestamp: new Date().toISOString()
    };

    const updatedHistory = [...(item.chatHistory || []), userMsg];
    onUpdateChat(updatedHistory);
    setInput('');
    setIsLoading(true);

    try {
      const aiResponseText = await chatWithMedia(item, input);
      const aiMsg: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        sender: 'SnapStream AI',
        text: aiResponseText,
        timestamp: new Date().toISOString(),
        isAi: true
      };
      onUpdateChat([...updatedHistory, aiMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px]">
      <div className="px-4 py-2 bg-rose-600/10 border-b border-rose-500/10 flex items-center justify-between">
        <span className="text-[8px] font-black text-rose-500 uppercase tracking-[0.2em] flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
          Neural Link Verified
        </span>
        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest italic">Encrypted Payload</span>
      </div>
      <div 
        ref={scrollRef}
        className="flex-grow overflow-y-auto p-4 space-y-4 no-scrollbar bg-black/20 border-x border-white/5 shadow-inner"
      >
        {(item.chatHistory || []).length === 0 && (
          <div className="text-center py-10 opacity-30">
            <i className="fas fa-comments text-4xl mb-4 block"></i>
            <p className="text-[10px] font-black uppercase tracking-widest">Neural Link Established. Send a pulse.</p>
          </div>
        )}
        {(item.chatHistory || []).map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.isAi ? 'items-start' : 'items-end'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed ${
              msg.isAi 
              ? 'bg-rose-950/40 border border-rose-500/20 text-rose-100 rounded-tl-none shadow-lg shadow-rose-900/10' 
              : 'bg-slate-800 text-white rounded-tr-none border border-white/5'
            }`}>
              {msg.text}
            </div>
            <span className="text-[8px] font-bold text-slate-600 mt-1 uppercase tracking-tighter">
              {msg.sender} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-rose-500">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
            </div>
          </div>
        )}
      </div>
      <form onSubmit={handleSend} className="p-4 bg-slate-900 rounded-b-3xl border border-white/5 flex gap-2">
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Query Neural Dataset..."
          className="flex-grow bg-black/40 border border-white/5 rounded-2xl px-4 py-3 text-xs text-white outline-none focus:border-rose-500/50 transition-all placeholder:text-slate-600"
        />
        <button 
          disabled={isLoading}
          className="w-12 h-12 bg-rose-600 hover:bg-rose-500 rounded-2xl flex items-center justify-center text-white transition-all shadow-xl shadow-rose-900/30 active:scale-90 disabled:opacity-50"
        >
          <i className={`fas ${isLoading ? 'fa-spinner animate-spin' : 'fa-paper-plane'}`}></i>
        </button>
      </form>
    </div>
  );
};

export default NeuralChat;
