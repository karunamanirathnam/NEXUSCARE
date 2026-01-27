
import React from 'react';
import { AppNotification } from '../types';

interface NotificationPageProps {
  notifications: AppNotification[];
  onClear: () => void;
}

const NotificationPage: React.FC<NotificationPageProps> = ({ notifications, onClear }) => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 animate-in fade-in duration-700">
      <div className="flex items-center justify-between mb-12">
        <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase flex items-center gap-4">
          <i className="fas fa-satellite-dish text-rose-600"></i>
          System Alerts
        </h1>
        <button 
          onClick={onClear}
          className="text-[10px] font-black text-slate-500 hover:text-rose-500 uppercase tracking-widest transition-all"
        >
          Flush All Transmissions
        </button>
      </div>

      <div className="space-y-6">
        {notifications.length === 0 ? (
          <div className="glass p-20 rounded-[3rem] text-center border-dashed border-rose-500/10">
            <i className="fas fa-bell-slash text-5xl text-slate-800 mb-6"></i>
            <p className="text-slate-500 font-bold uppercase tracking-widest">No active alerts in the SNS buffer.</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div 
              key={notif.id}
              className={`glass p-8 rounded-[2.5rem] border-l-8 flex gap-6 items-start transition-all hover:translate-x-2 ${
                notif.type === 'success' ? 'border-l-emerald-600 border-emerald-500/10' : 
                notif.type === 'alert' ? 'border-l-rose-600 border-rose-500/10' : 'border-l-blue-600 border-blue-500/10'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                notif.type === 'success' ? 'bg-emerald-600/20 text-emerald-500' : 
                notif.type === 'alert' ? 'bg-rose-600/20 text-rose-500' : 'bg-blue-600/20 text-blue-500'
              }`}>
                <i className={`fas ${notif.type === 'success' ? 'fa-circle-check' : notif.type === 'alert' ? 'fa-triangle-exclamation' : 'fa-info-circle'} text-xl`}></i>
              </div>
              <div className="flex-grow space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-black text-white tracking-tight italic uppercase">{notif.title}</h3>
                  <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                    {new Date(notif.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-slate-400 text-xs font-medium leading-relaxed uppercase tracking-wider">{notif.message}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-20 p-8 glass rounded-[3rem] border-rose-500/10 bg-rose-950/10">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-rose-600/10 flex items-center justify-center text-rose-500 border border-rose-500/20">
            <i className="fas fa-envelope-open-text text-2xl"></i>
          </div>
          <div>
            <h4 className="text-white font-black uppercase tracking-tight italic">AWS SNS Bridge</h4>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Real-time email forwarding is active for this identity session.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPage;
