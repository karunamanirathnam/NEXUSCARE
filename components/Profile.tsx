
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/apiService';

interface ProfileProps {
  user: User;
  onBack: () => void;
  onNotify: (title: string, message: string, type: 'success' | 'alert' | 'info') => void;
  onUserUpdate: (user: User) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onBack, onNotify, onUserUpdate }) => {
  const isAdmin = user.role === UserRole.ADMIN;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: user.username,
    email: user.email,
    securityQuestion: user.securityQuestion || 'What was your first pet name?',
    securityAnswer: ''
  });

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await api.updateUser(user.id, {
        username: formData.username,
        email: formData.email,
        securityQuestion: formData.securityQuestion,
        // Fix: Use trim() instead of strip() for string whitespace removal
        ...(formData.securityAnswer ? { securityAnswer: formData.securityAnswer.toLowerCase().trim() } : {})
      });

      if (result.success) {
        onUserUpdate(result.user);
        onNotify('Registry Updated', 'Identity details successfully synchronized with the AWS cluster.', 'success');
      } else {
        onNotify('Update Failed', result.message || 'Identity synchronization encountered a conflict.', 'alert');
      }
    } catch (err) {
      onNotify('System Error', 'Neural link instability detected. Please retry.', 'alert');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex items-center gap-6 mb-12">
        <button 
          onClick={onBack}
          className="w-12 h-12 rounded-2xl glass flex items-center justify-center hover:text-emerald-500 border-emerald-500/10 transition-all shadow-lg"
        >
          <i className="fas fa-chevron-left"></i>
        </button>
        <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase">
          {isAdmin ? 'System Master Console' : 'Profile Settings'}
        </h1>
      </div>

      <div className="grid lg:grid-cols-12 gap-10">
        {/* Left Sidebar: Brief Stats */}
        <div className="lg:col-span-4 space-y-8">
          <div className="glass p-10 rounded-[3rem] text-center border-emerald-500/10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
            <div className="w-28 h-28 bg-gradient-to-br from-emerald-500 to-emerald-900 rounded-[2rem] mx-auto mb-8 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.3)] rotate-3">
              <span className="text-5xl font-black text-white">{user.username.charAt(0).toUpperCase()}</span>
            </div>
            <h2 className="text-2xl font-black text-white truncate">{user.username}</h2>
            <p className="text-emerald-900 text-xs font-bold mb-8 uppercase tracking-widest">{user.email}</p>
            <span className="px-5 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-[0.2em] italic">
              {user.role} ACCESS
            </span>
          </div>

          <div className="glass p-8 rounded-[2.5rem] border-emerald-500/10">
            <h3 className="text-[10px] font-black text-emerald-900 uppercase tracking-[0.3em] mb-6 italic">System Health Metrics</h3>
            <div className="space-y-6">
              <HealthBar label="Database Sync" percent={100} />
              <HealthBar label="Security Uptime" percent={99} />
              <HealthBar label="API Response" percent={94} />
            </div>
          </div>
        </div>

        {/* Right Content: Identity Form */}
        <div className="lg:col-span-8 space-y-8">
          <div className="glass p-10 rounded-[3rem] border-emerald-500/10">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                <i className="fas fa-id-card"></i>
              </div>
              <h3 className="text-xl font-black text-white uppercase tracking-wider italic">Identity Management</h3>
            </div>

            <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-emerald-700 uppercase tracking-widest ml-1">Legal Identity Name</label>
                <input 
                  type="text" 
                  className="w-full bg-black/60 border border-emerald-500/20 rounded-2xl py-4 px-6 text-white text-sm focus:border-emerald-500/70 outline-none transition-all"
                  value={formData.username}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-emerald-700 uppercase tracking-widest ml-1">Contact Endpoint (Email)</label>
                <input 
                  type="email" 
                  className="w-full bg-black/60 border border-emerald-500/20 rounded-2xl py-4 px-6 text-white text-sm focus:border-emerald-500/70 outline-none transition-all"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>

              <div className="md:col-span-2 border-t border-emerald-500/10 pt-8 mt-4 space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <i className="fas fa-shield-halved text-emerald-800"></i>
                  <h4 className="text-[10px] font-black text-emerald-800 uppercase tracking-[0.3em]">Security Recovery Protocol</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-emerald-700 uppercase tracking-widest ml-1">Challenge Question</label>
                    <select 
                      className="w-full bg-black/60 border border-emerald-500/20 rounded-2xl py-4 px-6 text-white text-sm focus:border-emerald-500/70 outline-none transition-all"
                      value={formData.securityQuestion}
                      onChange={e => setFormData({...formData, securityQuestion: e.target.value})}
                    >
                      <option>What was your first pet name?</option>
                      <option>What is your mother's maiden name?</option>
                      <option>What is your city of birth?</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-emerald-700 uppercase tracking-widest ml-1">Secret Key (New Answer)</label>
                    <input 
                      type="password" 
                      placeholder="Leave blank to keep current"
                      className="w-full bg-black/60 border border-emerald-500/20 rounded-2xl py-4 px-6 text-white text-sm focus:border-emerald-500/70 outline-none transition-all placeholder:text-emerald-900"
                      value={formData.securityAnswer}
                      onChange={e => setFormData({...formData, securityAnswer: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 pt-6">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full md:w-auto px-12 py-5 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 rounded-3xl font-black text-xs uppercase tracking-[0.3em] shadow-xl transition-all disabled:opacity-50 active:scale-95"
                >
                  {loading ? <i className="fas fa-spinner animate-spin"></i> : 'Commit Session Changes'}
                </button>
              </div>
            </form>
          </div>

          <div className="glass p-10 rounded-[3rem] border-red-500/30 bg-red-950/20 shadow-[0_0_40px_rgba(239,68,68,0.1)]">
            <h3 className="text-xl font-black mb-4 text-red-500 uppercase tracking-tight italic">Terminal Deactivation</h3>
            <p className="text-red-900/60 text-xs font-bold mb-8 leading-relaxed uppercase tracking-widest italic">
              Permanently removal of your medical identity and appointment history from the AWS Nexus cluster. This action is irreversible.
            </p>
            <button className="bg-red-500/10 hover:bg-red-600 text-red-500 hover:text-white px-8 py-4 rounded-2xl font-black text-[10px] tracking-[0.3em] uppercase transition-all border border-red-500/40 active:scale-95 shadow-lg">
              Deactivate Identity
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const HealthBar: React.FC<{ label: string, percent: number }> = ({ label, percent }) => (
  <div className="space-y-2">
    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-emerald-900">
      <span>{label}</span>
      <span className="text-emerald-500">{percent}%</span>
    </div>
    <div className="h-1 bg-emerald-950 rounded-full overflow-hidden border border-white/5">
      <div 
        className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
        style={{ width: `${percent}%` }}
      ></div>
    </div>
  </div>
);

export default Profile;
