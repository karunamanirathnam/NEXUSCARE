
import React from 'react';
import { User } from '../types';

interface HeaderProps {
  user: User;
  onLogout: () => void;
  onNavigate: (view: string) => void;
  notificationCount: number;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, onNavigate, notificationCount }) => {
  return (
    <header className="sticky top-0 z-50 bg-emerald-950/40 backdrop-blur-xl border-b border-emerald-500/10 px-6 py-4">
      <div className="max-w-[1800px] mx-auto flex items-center justify-between gap-8">
        <div className="flex items-center gap-4 cursor-pointer group shrink-0" onClick={() => onNavigate('dashboard')}>
          <div className="living-logo relative w-10 h-10 bg-emerald-500 rounded-xl shadow-lg transition-transform group-hover:rotate-6">
            <i className="fas fa-heart-pulse text-white text-lg"></i>
          </div>
          <span className="text-2xl font-black tracking-tight text-white hidden sm:block italic">
            NEXUS<span className="text-emerald-500">CARE</span>
          </span>
        </div>

        <div className="flex-grow max-w-2xl hidden md:flex items-center">
          <div className="relative w-full">
            <input type="text" placeholder="Access records or specialists..." className="w-full bg-emerald-900/20 border border-emerald-500/20 rounded-full py-2.5 px-6 focus:border-emerald-500/50 outline-none text-sm text-emerald-100 placeholder:text-emerald-800" />
            <i className="fas fa-search absolute right-5 top-1/2 -translate-y-1/2 text-emerald-800"></i>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <button onClick={() => onNavigate('notifications')} className="w-10 h-10 rounded-full flex items-center justify-center text-emerald-400 hover:bg-emerald-500/10 transition relative">
            <i className="fas fa-bell"></i>
            {notificationCount > 0 && <span className="absolute top-2 right-2 w-4 h-4 bg-emerald-500 text-[8px] font-black text-white rounded-full flex items-center justify-center border-2 border-emerald-950">{notificationCount}</span>}
          </button>
          
          <div onClick={() => onNavigate('profile')} className="flex items-center gap-3 pl-2 border-l border-emerald-500/10 cursor-pointer group">
            <div className="w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <span className="text-xs font-bold text-emerald-950">{user.username.charAt(0).toUpperCase()}</span>
            </div>
            <div className="hidden lg:block">
              <p className="text-[11px] font-black text-white uppercase tracking-tight leading-none">{user.username}</p>
              <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">{user.role}</p>
            </div>
          </div>
          
          <button onClick={onLogout} className="w-10 h-10 rounded-full flex items-center justify-center text-emerald-800 hover:text-emerald-500 transition-all">
            <i className="fas fa-power-off"></i>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
