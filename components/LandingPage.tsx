
import React from 'react';

interface LandingPageProps {
  onSignIn: () => void;
  onCreateAccount: () => void;
  onAdminPortal: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSignIn, onCreateAccount }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-1000">
      <div className="relative mb-12 floating">
        <div className="pulse-ring rounded-[2.5rem]"></div>
        <div className="w-32 h-32 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center shadow-[0_0_60px_rgba(16,185,129,0.4)] relative z-10">
          <i className="fas fa-heart-pulse text-emerald-950 text-6xl"></i>
        </div>
      </div>

      <h1 className="text-7xl font-black tracking-tighter text-white mb-2 italic">
        NEXUS<span className="text-emerald-500 text-glow-emerald">CARE</span>
      </h1>
      <p className="text-emerald-400 font-bold tracking-[0.4em] uppercase text-xs mb-12 opacity-80">
        Secure Medical Cloud Ecosystem
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-lg mb-12">
        <button 
          onClick={onSignIn}
          className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3"
        >
          <i className="fas fa-right-to-bracket"></i>
          Sign In
        </button>
        <button 
          onClick={onCreateAccount}
          className="bg-white/5 hover:bg-white/10 text-emerald-400 border border-emerald-500/30 px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3"
        >
          <i className="fas fa-user-plus"></i>
          Create Account
        </button>
      </div>

      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-4 text-emerald-900/40">
          <div className="h-px w-12 bg-emerald-500/20"></div>
          <span className="text-[10px] font-black uppercase tracking-widest">AWS Cloud Hub Verified</span>
          <div className="h-px w-12 bg-emerald-500/20"></div>
        </div>
        <p className="text-[9px] font-black text-emerald-800 uppercase tracking-widest">
          Authorized Medical Staff Use Dedicated Portal Controls
        </p>
      </div>
    </div>
  );
};

export default LandingPage;
