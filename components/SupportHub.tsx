
import React, { useState, useRef, useEffect } from 'react';
import { User, ChatMessage } from '../types';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface SupportHubProps {
  user: User;
  onNotify: (title: string, message: string, type: 'success' | 'alert' | 'info') => void;
  isCompact?: boolean;
}

const SupportHub: React.FC<SupportHubProps> = ({ user, onNotify, isCompact = false }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const quickQuestions = [
    "Common symptoms of seasonal flu?",
    "Healthy habits for heart health?",
    "How to manage stress and anxiety?",
    "Benefits of a balanced diet?"
  ];

  const handleSend = async (textToSend?: string) => {
    const messageText = textToSend || input;
    if (!messageText.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      sender: user.username,
      text: messageText,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: messageText,
        config: {
          systemInstruction: `
            You are the "NexusCare AI Medical Assistant".
            - Your Primary Goal: Answer general medical questions, explain health conditions in simple terms, and provide wellness guidance.
            - Authority Level: You are an AI assistant, NOT a doctor.
            - MANDATORY DISCLAIMER: "Please note: I am an AI assistant and cannot provide official medical diagnosis or prescriptions. Always consult with one of our specialists in the 'Registry' for professional medical advice."
            - Tone: Compassionate, professional, and clinical.
            - Constraint: Be concise but thorough. Focus on evidence-based health information.
            - Current Context: You are part of the NexusCare Hospital cloud system.
          `
        }
      });

      const aiMsg: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        sender: 'Nexus AI',
        text: response.text || "I am currently processing high volume of medical data. Please try again shortly.",
        timestamp: new Date().toISOString(),
        isAi: true
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      onNotify('AI Link Failure', 'The neural medical hub is currently unreachable.', 'alert');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex flex-col ${isCompact ? 'h-[500px]' : 'h-[750px] animate-in fade-in slide-in-from-bottom-6 duration-700'}`}>
      {!isCompact && (
        <div className="mb-10 bg-emerald-950/20 p-8 rounded-[3rem] border border-emerald-500/10 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">Medical Knowledge Hub</h2>
            <p className="text-emerald-500 font-bold text-[10px] tracking-[0.4em] uppercase mt-2 italic">General Medical Queries & Wellness Support</p>
          </div>
          <div className="w-16 h-16 bg-emerald-600 rounded-[2rem] flex items-center justify-center text-white text-2xl shadow-xl shadow-emerald-900/40">
            <i className="fas fa-brain"></i>
          </div>
        </div>
      )}

      <div className={`glass flex flex-col flex-grow overflow-hidden ${isCompact ? 'rounded-3xl' : 'rounded-[4rem]'} border-white/5 shadow-2xl`}>
        <div className="p-5 bg-white/5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white text-lg">
              <i className="fas fa-robot"></i>
            </div>
            <div>
              <p className="text-white font-black text-xs uppercase italic">Nexus AI Assistant</p>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Medical Engine Online</span>
              </div>
            </div>
          </div>
          {!isCompact && <span className="text-[8px] font-black text-emerald-900 uppercase tracking-widest">HIPAA Secure Channel</span>}
        </div>

        <div ref={scrollRef} className="flex-grow overflow-y-auto p-6 md:p-8 space-y-6 bg-black/40 no-scrollbar">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-10">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20">
                <i className="fas fa-stethoscope text-4xl text-emerald-500"></i>
              </div>
              <p className="text-white font-black text-sm uppercase italic mb-2 tracking-tight">Ask me anything about health</p>
              <p className="text-emerald-900 text-[10px] font-bold uppercase tracking-widest max-w-xs leading-relaxed mb-8">
                I can help with symptoms, wellness tips, and general medical definitions.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                {quickQuestions.map(q => (
                  <button 
                    key={q}
                    onClick={() => handleSend(q)}
                    className="text-[9px] font-black text-emerald-500 uppercase tracking-widest p-4 bg-emerald-950/20 border border-emerald-500/10 rounded-2xl hover:bg-emerald-500 hover:text-emerald-950 transition-all text-left"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.isAi ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[85%] md:max-w-[75%] p-5 rounded-[2rem] text-sm leading-relaxed ${
                  msg.isAi 
                  ? 'bg-emerald-950/40 border border-emerald-500/20 text-emerald-100 rounded-tl-none italic' 
                  : 'bg-emerald-900/40 text-white border border-emerald-500/10 rounded-tr-none shadow-xl'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-emerald-950/20 p-4 rounded-3xl flex gap-1 animate-pulse border border-emerald-500/10">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <div className="w-2 h-2 bg-emerald-500 rounded-full" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-emerald-500 rounded-full" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="p-6 md:p-8 bg-black/60 border-t border-white/5 flex gap-4">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a medical question..."
            className="flex-grow bg-emerald-950/40 border border-emerald-500/10 rounded-2xl py-4 px-6 text-sm text-white outline-none focus:border-emerald-500/50 transition-all placeholder:text-emerald-900"
          />
          <button 
            type="submit"
            disabled={isLoading || !input.trim()}
            className="w-14 h-14 md:w-16 md:h-16 bg-emerald-600 hover:bg-emerald-500 rounded-2xl flex items-center justify-center text-white text-xl transition shadow-xl active:scale-95 disabled:opacity-50"
          >
            <i className={`fas ${isLoading ? 'fa-spinner animate-spin' : 'fa-paper-plane'}`}></i>
          </button>
        </form>
      </div>
    </div>
  );
};

export default SupportHub;
