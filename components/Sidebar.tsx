
import React from 'react';
import { UserRole } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: UserRole;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, userRole }) => {
  const menuItems = [
    { id: 'home', icon: 'fa-house-medical', label: 'Dashboard' },
    { id: 'calendar', icon: 'fa-calendar-days', label: 'Schedule' },
    ...(userRole === UserRole.DOCTOR ? [{ id: 'slots', icon: 'fa-clock', label: 'Slots' }] : []),
    ...(userRole === UserRole.ADMIN ? [
      { id: 'doctors', icon: 'fa-user-nurse', label: 'Registry' },
      { id: 'patients', icon: 'fa-id-card-clip', label: 'IAM Console' }
    ] : []),
    { id: 'records', icon: 'fa-brain', label: 'AI Assistant' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 fixed left-0 top-[88px] bottom-0 bg-emerald-950/20 backdrop-blur-xl border-r border-emerald-500/5 p-6 z-40">
      <div className="space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold transition-all group ${
              activeTab === item.id 
              ? 'sidebar-active-emerald text-white' 
              : 'text-emerald-700 hover:bg-emerald-500/10 hover:text-emerald-400'
            }`}
          >
            <i className={`fas ${item.icon} text-lg transition-transform group-hover:scale-110`}></i>
            <span className="text-[11px] font-extrabold uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-10 pt-10 border-t border-emerald-500/5">
        <h3 className="px-5 text-[10px] font-black uppercase tracking-[0.3em] text-emerald-900 mb-6">Operations</h3>
        <button
          onClick={() => setActiveTab('settings')}
          className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold transition-all group ${
            activeTab === 'settings' 
            ? 'sidebar-active-emerald text-white' 
            : 'text-emerald-700 hover:bg-emerald-500/10'
          }`}
        >
          <i className="fas fa-sliders text-lg group-hover:rotate-90 transition-transform"></i>
          <span className="text-[11px] font-extrabold uppercase tracking-widest">Settings</span>
        </button>
      </div>

      <div className="mt-auto p-6 bg-emerald-500/5 rounded-[2.5rem] border border-emerald-500/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Cloud Active</span>
        </div>
        <div className="space-y-2">
          <div className="h-1 bg-emerald-950 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500/40 w-1/3 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]"></div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
